const config = require('../lib/config');

module.exports = async (ctx) => {
    ctx.response.body = JSON.stringify({
        status: 'success',
        api_version: 1,
        required_info: config.requiredInfo,
    }, null, 4);
};
