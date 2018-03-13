const fs = require('fs');
const path = require('path');
const beautify = require('json-beautify');

module.exports = async (ctx) => {
    const absPath = p => path.resolve(ctx.userConfig.basePath, 'threads', `${p}.db`);
    ctx.type = 'application/json';
    if (fs.existsSync(absPath(ctx.params.name))) {
        ctx.response.body = beautify({
            name: ctx.params.name,
            exist: true,
        }, null, 4);
        // TODO: 若干 SQL 逻辑
    } else {
        ctx.response.body = beautify({
            name: ctx.params.name,
            content: {},
        }, null, 4);
    }
};
