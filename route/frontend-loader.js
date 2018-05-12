const config = require('../lib/config');

const addEscape = target => target.split("'").join("\\'");

module.exports = async (ctx) => {
    const {
        script, element, server, fixedHeight,
    } = config.common.frontendLoader;
    const threadName = ctx.params.name;
    ctx.type = 'text/javascript';
    ctx.response.body = `(function () {
    var s = document.createElement('script');
    var e = document.querySelector('${addEscape(element)}');
    var c = document.querySelector('link[rel=canonical]');
    s.src = '${addEscape(script)}';
    s.onload = function () {
        var pomment = new Pomment(e, '${addEscape(server)}', '${addEscape(threadName)}', {
            fixedHeight: ${fixedHeight}
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
