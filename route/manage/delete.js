const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const structThread = require('../../struct/thread');
const structPostUnread = require('../../struct/post-unread');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
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

    const seqList = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: path.resolve(target, 'index.db'),
        operatorsAliases: false,
    });
    const thread = seqList.define('thread', structThread);
    await thread.destroy({
        force: true,
        where: {
            name: info.url,
        },
    });

    const postUnread = seqList.define('recent', structPostUnread, {
        createdAt: false,
        updatedAt: false,
    });
    await postUnread.destroy({
        force: true,
        where: {
            location: info.url,
        },
    });

    const fileData = path.resolve(target, 'threads', `${sha256(info.url)}.db`);
    const fileLock = path.resolve(target, 'threads', `${sha256(info.url)}.lock`);
    if (fs.existsSync(fileData)) fs.unlinkSync(fileData);
    if (fs.existsSync(fileLock)) fs.unlinkSync(fileLock);

    ctx.response.body = JSON.stringify({ status: 'success' }, null, 4);
    return true;
};
