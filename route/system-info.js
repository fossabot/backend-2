const config = require('../lib/config');

module.exports = async (ctx) => {
    ctx.response.body = JSON.stringify({
        success: true,
        api_version: 1,
        required_info: config.common.requiredInfo,
    }, null, 4);
};
