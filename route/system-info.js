module.exports = async (ctx) => {
    ctx.response.body = JSON.stringify({
        status: 'success',
        api_version: 1,
        required_info: ctx.userConfig.info.requiredInfo,
    }, null, 4);
};
