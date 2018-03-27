const fs = require('fs');
const path = require('path');
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

    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.lock`);
    printLog('debug', `Variable absPath: ${absPath}`);
    if (fs.existsSync(absPath)) {
        try {
            fs.unlinkSync(absPath);
            ctx.response.body = JSON.stringify({ status: 'success', info: 'thread unlocked' }, null, 4);
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = JSON.stringify({ status: 'error', info: 'unlock thread failed' }, null, 4);
            return false;
        }
    } else {
        ctx.response.body = JSON.stringify({ status: 'success', info: 'thread unlocked' }, null, 4);
    }
    return true;
};
