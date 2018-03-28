const path = require('path');
const Sequelize = require('sequelize');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
const structPost = require('../../struct/post');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    if (!auth(ctx.userConfig.info, info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'auth failed' }, null, 4);
        return false;
    }

    try {
        const keyList = Object.keys(info.data);
        if (keyList.indexOf('id') !== -1) {
            delete info.data.id;
        }
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: absPath,
            operatorsAliases: false,
        });
        const post = sequelize.define('post', structPost, {
            createdAt: false,
            updatedAt: false,
        });
        await post.update(info.data, {
            where: {
                id: info.id,
            },
        });
        ctx.response.body = JSON.stringify({ status: 'success', info: 'post updated' }, null, 4);
        return true;
    } catch (e) {
        printLog('error', `An error occurred while updating the post: ${e}`);
        ctx.status = 500;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'update post failed' }, null, 4);
        return false;
    }
    return true;
};
