const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
const structPost = require('../../struct/post');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    if (!auth(ctx.userConfig.info, info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'auth failed' }, null, 4);
        return false;
    }

    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    printLog('debug', `Variable absPath: ${absPath}`);
    if (fs.existsSync(absPath)) {
        try {
            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage: absPath,
                operatorsAliases: false,
            });

            const Post = sequelize.define('post', structPost, {
                createdAt: false,
                updatedAt: false,
            });
            const content = await Post.findAll({
                where: info.showHidden ? {} : { hidden: false },
            });

            ctx.response.body = JSON.stringify({
                status: 'success',
                name: ctx.params.name,
                locked: fs.existsSync(path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.lock`)),
                content,
            }, null, 4);
        } catch (e) {
            printLog('error', `An error occurred while showing post: ${e}`);
            ctx.status = 500;
            ctx.response.body = JSON.stringify({ status: 'error', info: 'list unread post failed' }, null, 4);
            return false;
        }
    } else {
        ctx.status = 404;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'thread not found' }, null, 4);
    }
    return true;
};
