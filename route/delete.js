const path = require('path');
const Sequelize = require('sequelize');
const structPost = require('../struct/post');
const config = require('../lib/config');
const target = require('../lib/base-path');
const printLog = require('../lib/log');
const sha256 = require('../lib/get-sha256');
const fs = require('fs');

const getProm = (ctx, value) => new Promise((resolve) => {
    ctx.redisClient.get(value, (err, reply) => {
        if (err) {
            resolve(null);
        } else {
            resolve(reply);
        }
    });
});

module.exports = async (ctx) => {
    ctx.type = 'application/json';
    const info = ctx.request.body;
    const absPath = path.resolve(target, 'threads', `${sha256(info.url)}.db`);
    printLog('debug', `Use route handler ${__filename}`);
    if (!info.url || !fs.existsSync(absPath)) {
        ctx.status = 404;
        ctx.response.body = JSON.stringify({ success: false, info: 'post not found' }, null, 4);
        return false;
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
    const editToken = await getProm(ctx, `${config.redis.prefix}${sha256(`${info.url}, ${info.id}`)}`);
    printLog('debug', `${config.redis.prefix}${sha256(`${info.url}, ${info.id}`)}: ${editToken}`);
    if (!editToken || editToken !== info.token) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ success: false, info: 'bad token' }, null, 4);
        return false;
    }
    await post.update({
        hidden: true,
    }, {
        where: {
            id: info.id,
        },
    });
    ctx.response.body = JSON.stringify({ success: true }, null, 4);
    return true;
};
