const config = require('../lib/config');

module.exports = async (ctx) => {
    ctx.type = 'text/javascript';
    ctx.response.body = `(function () {
    var opt = ${JSON.stringify(config.common.frontendLoader)};
    var s = document.createElement('script');
    var e = document.querySelector(opt.element);
    var c = document.querySelector('link[rel=canonical]');
    s.src = opt.script;
    s.onload = function () {
        var pomment = new Pomment(e, opt.server, {
            fixedHeight: opt.fixedHeight
        });
        if (c) {
            pomment.url = c.href;
        }
        pomment.init();
    }
    document.body.appendChild(s);
})();
`;
};
