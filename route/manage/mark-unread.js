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
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: path.resolve(target, 'index.db'),
        operatorsAliases: false,
    });

    const unreadPost = sequelize.define('recent', structPostUnread, {
        createdAt: false,
        updatedAt: false,
    });
    await unreadPost.destroy({
        where: { origin_id: info.id },
    });

    ctx.response.body = JSON.stringify({
        status: 'success',
    }, null, 4);
    return true;
};
