const path = require('path');
const Sequelize = require('sequelize');
const structThread = require('../../struct/thread');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
const target = require('../../lib/base-path');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    if (!auth(info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'auth failed' }, null, 4);
        return false;
    }

    if (isBlank(info.title) || isBlank(info.url)) {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'bad meta' }, null, 4);
        return false;
    }

    try {
        const seqList = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: path.resolve(target, 'index.db'),
            operatorsAliases: false,
        });
        const thread = seqList.define('thread', structThread);
        await thread.update({
            title: info.title,
            url: info.url,
        }, {
            where: { name: info.url },
        });
        ctx.response.body = JSON.stringify({ status: 'success' }, null, 4);
        return true;
    } catch (e) {
        printLog('error', `An error occurred while updating the thread meta: ${e}`);
        ctx.status = 500;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'update thread meta failed' }, null, 4);
        return false;
    }
};
