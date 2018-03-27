const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const structThread = require('../../struct/thread');
const structPostUnread = require('../../struct/post-unread');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    if (!auth(ctx.userConfig.info, info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({status: 'error', info: 'auth failed'}, null, 4);
        return false;
    }

    try {
        // 删除索引记录
        const seqList = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: path.resolve(ctx.userConfig.basePath, 'index.db'),
            operatorsAliases: false,
        });
        const thread = seqList.define('thread', structThread);
        await thread.destroy({
            force: true,
            where: {
                name: ctx.params.name,
            },
        });

        // 删除存在的最近评论
        const postUnread = seqList.define('recent', structPostUnread, {
            createdAt: false,
            updatedAt: false,
        });
        await postUnread.destroy({
            force: true,
            where: {
                location: ctx.params.name,
            },
        });

        // 删除文件
        const fileData = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
        const fileLock = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.lock`);
        if (fs.existsSync(fileData)) fs.unlinkSync(fileData);
        if (fs.existsSync(fileLock)) fs.unlinkSync(fileLock);

        // 操作结果
        ctx.response.body = JSON.stringify({ status: 'success', info: 'thread deleted' }, null, 4);
        return true;
    } catch (e) {
        printLog('error', `An error occurred while deleting the thread: ${e}`);
        ctx.status = 500;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'delete thread failed' }, null, 4);
        return false;
    }
};
