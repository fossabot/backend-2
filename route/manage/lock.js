const fs = require('fs');
const path = require('path');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');

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
        ctx.response.body = JSON.stringify({ status: 'success' }, null, 4);
    } else {
        try {
            fs.openSync(absPath, 'w');
            ctx.response.body = JSON.stringify({ status: 'success' }, null, 4);
        } catch (e) {
            printLog('error', `An error occurred while locking the thread: ${e}`);
            ctx.status = 500;
            ctx.response.body = JSON.stringify({ status: 'error', info: 'lock thread failed' }, null, 4);
            return false;
        }
    }
    return true;
};
