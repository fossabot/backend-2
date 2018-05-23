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
    const absPath = path.resolve(target, 'threads', `${sha256(info.url)}.db`);
    if (!auth(info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ success: false, info: 'auth failed' }, null, 4);
        return false;
    }

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
    ctx.response.body = JSON.stringify({ success: true }, null, 4);
    return true;
};
