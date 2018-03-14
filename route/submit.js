const fs = require('fs');
const path = require('path');
const printLog = require('../lib/log');
const initThread = require('../lib/initThread');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);

    let output;
    const info = JSON.parse(ctx.request.body);
    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    printLog('debug', `Variable absPath: ${absPath}`);

    if (fs.existsSync(absPath)) {
        // TODO: sql query
    } else {
        printLog('info', `Creating new database for thread ${ctx.params.name}`);
        await initThread(absPath);
    }

    ctx.type = 'application/json';
    ctx.response.body = output;
    console.log(ctx.userConfig);
};
