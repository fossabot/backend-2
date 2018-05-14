const fs = require('fs');
const path = require('path');
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

    const absPath = path.resolve(target, 'threads', `${info.url}.lock`);
    printLog('debug', `Variable absPath: ${sha256(absPath)}`);
    if (fs.existsSync(absPath)) {
        try {
            fs.unlinkSync(absPath);
            ctx.response.body = JSON.stringify({ status: 'success' }, null, 4);
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
