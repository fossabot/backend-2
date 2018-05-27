const path = require('path');
const Sequelize = require('sequelize');
const structPost = require('../struct/post');
const getEditToken = require('../lib/get-salted');
const config = require('../lib/config');
const target = require('../lib/base-path');
const printLog = require('../lib/log');
const sha256 = require('../lib/get-sha256');
const fs = require('fs');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

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
    let currentError;
    if (isBlank(info.content)) {
        currentError = 'bad content';
    }
    if (config.guard.gusetEditTimeout < 0) {
        currentError = 'guest edit is disabled';
    }
    if (typeof currentError !== 'undefined') {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ success: false, info: currentError }, null, 4);
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
    const verify = await post.find({
        where: {
            id: info.id,
        },
    });
    const editToken = config.guard.gusetEditTimeout < 0 ? false : getEditToken(
        verify.dataValues.email,
        info.url,
        verify.dataValues.id,
        verify.dataValues.birth,
        ctx.userConfig.salt,
    ).digest('hex');
    const gap = (new Date().getTime() - verify.dataValues.birth.getTime()) / 1000;
    printLog('debug', `${gap}, ${config.guard.gusetEditTimeout}`);
    printLog('debug', editToken);
    if (!editToken || editToken !== info.token) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ success: false, info: 'bad token' }, null, 4);
        return false;
    }
    if (gap > config.guard.gusetEditTimeout && config.guard.gusetEditTimeout !== 0) {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ success: false, info: 'time expired' }, null, 4);
        return false;
    }
    await post.update({
        content: info.content,
    }, {
        where: {
            id: info.id,
        },
    });
    ctx.response.body = JSON.stringify({ success: true }, null, 4);
    return true;
};
