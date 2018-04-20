const path = require('path');
const Sequelize = require('sequelize');
const structPost = require('../struct/post');
const getEditToken = require('../lib/get-edit-token');
const printLog = require('../lib/log');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    const info = ctx.request.body;
    const config = ctx.userConfig.info;
    let currentError;
    if (isBlank(info.content)) {
        currentError = 'bad content';
    }
    if (config.gusetEditTimeout < 0) {
        currentError = 'guest edit is disabled';
    }
    if (typeof currentError !== 'undefined') {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ status: 'error', info: currentError }, null, 4);
        return false;
    }
    try {
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
        const editToken = config.gusetEditTimeout < 0 ? false : getEditToken(
            verify.dataValues.email,
            verify.dataValues.ip,
            ctx.params.name,
            verify.dataValues.id,
            verify.dataValues.birth,
            ctx.userConfig.salt,
        );
        if (!editToken || editToken !== info.token) {
            ctx.response.body = JSON.stringify({ status: 'error', info: 'bad token' }, null, 4);
            return false;
        }
        if (!verify ||
            (((new Date().getTime() - verify.dataValues.birth.getTime()) / 1000 >
            config.gusetEditTimeout) && config.gusetEditTimeout !== 0)) {
            ctx.response.body = JSON.stringify({ status: 'error', info: 'time expired' }, null, 4);
            return false;
        }
        await post.update({
            content: info.content,
        }, {
            where: {
                id: info.id,
            },
        });
        ctx.response.body = JSON.stringify({ status: 'success' }, null, 4);
        return true;
    } catch (e) {
        printLog('error', `An error occurred while editing the thread: ${e}`);
        ctx.status = 500;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'edit thread failed' }, null, 4);
        return false;
    }
};
