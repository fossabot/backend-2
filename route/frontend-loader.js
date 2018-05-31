const config = require('../lib/config');

module.exports = async (ctx) => {
    ctx.type = 'text/javascript';
    ctx.response.body = `${global.POMMENT_JS}
(function () {
    var opt = ${JSON.stringify(config.common.frontendLoader)};
    var e = document.querySelector(opt.element);
    var pomment = new Pomment(e, opt.server, {
        fixedHeight: opt.fixedHeight,
    });
    pomment.init();
})();
`;
};
