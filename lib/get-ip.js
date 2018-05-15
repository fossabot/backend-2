const getIP = (ctx) => {
    if (ctx.header['x-real-ip']) {
        return ctx.header['x-real-ip'];
    }
    return ctx.ip;
};

module.exports = getIP;
