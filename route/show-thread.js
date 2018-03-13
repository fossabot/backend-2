const beautify = require('json-beautify');

module.exports = async (ctx) => {
    ctx.response.body = beautify({
        name: ctx.params.name,
        conf: ctx.userConfig,
    }, null, 4);
};
