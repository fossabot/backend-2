const beautify = require('json-beautify');

module.exports = async (ctx) => {
    ctx.type = 'application/json';
    ctx.response.body = beautify({
        name: ctx.params.name,
        conf: ctx.userConfig,
    }, null, 4);
};
