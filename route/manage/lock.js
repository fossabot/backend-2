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
        ctx.response.body = JSON.stringify({ success: false, info: 'auth failed' }, null, 4);
        return false;
    }

    const absPath = path.resolve(target, 'threads', `${sha256(info.url)}.lock`);
    printLog('debug', `Variable absPath: ${absPath}`);
    if (fs.existsSync(absPath)) {
        ctx.response.body = JSON.stringify({ success: true }, null, 4);
    } else {
        fs.openSync(absPath, 'w');
        ctx.response.body = JSON.stringify({ success: true }, null, 4);
    }
    return true;
};
