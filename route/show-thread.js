const beautify = require('json-beautify');

module.exports = async (ctx) => {
    ctx.response.body = beautify({
        name: ctx.params.name,
    }, null, 4);
};
