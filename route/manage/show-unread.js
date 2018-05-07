const path = require('path');
const Sequelize = require('sequelize');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
const structPostUnread = require('../../struct/post-unread');
const target = require('../../lib/base-path');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    if (!auth(info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'auth failed' }, null, 4);
        return false;
    }
    try {
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: path.resolve(target, 'index.db'),
            operatorsAliases: false,
        });

        const unreadPost = sequelize.define('recent', structPostUnread, {
            createdAt: false,
            updatedAt: false,
        });
        const content = await unreadPost.findAll({
            where: { marked: false },
        });

        ctx.response.body = JSON.stringify({
            status: 'success',
            content,
        }, null, 4);
    } catch (e) {
        printLog('error', `An error occurred while showing unread post: ${e}`);
        ctx.status = 500;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'list unread post failed' }, null, 4);
        return false;
    }
    return true;
};
