module.exports = async (ctx) => {
    ctx.status = 404;
    ctx.response.body = JSON.stringify({
        status: 'error',
        info: 'not found',
    }, null, 4);
};
