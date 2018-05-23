const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
const structPost = require('../../struct/post');
const target = require('../../lib/base-path');
const sha256 = require('../../lib/get-sha256');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    if (!auth(info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'auth failed' }, null, 4);
        return false;
    }

    const absPath = path.resolve(target, 'threads', `${sha256(info.url)}.db`);
    printLog('debug', `Variable absPath: ${absPath}`);
    if (fs.existsSync(absPath)) {
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: absPath,
            operatorsAliases: false,
        });

        const Post = sequelize.define('post', structPost, {
            createdAt: false,
            updatedAt: false,
        });
        const content = await Post.find({
            where: info.id,
        });

        ctx.response.body = JSON.stringify({
            status: 'success',
            content,
        }, null, 4);
    } else {
        ctx.status = 404;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'thread not found' }, null, 4);
    }
    return true;
};
