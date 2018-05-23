module.exports = async (ctx) => {
    ctx.status = 404;
    ctx.response.body = JSON.stringify({
        success: false,
        info: 'not found',
    }, null, 4);
};
