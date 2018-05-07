const addEscape = target => target.split("'").join("\\'");

module.exports = async (ctx) => {
    const config = ctx.userConfig.info;
    const { script, element, server } = config.frontendLoader;
    const threadName = ctx.params.name;
    ctx.type = 'text/javascript';
    ctx.response.body = `(function () {
    var s = document.createElement('script');
    var e = document.querySelector('${addEscape(element)}');
    var c = document.querySelector('link[rel=canonical]');
    s.src = '${addEscape(script)}';
    s.onload = function () {
        var pomment = new Pomment(e, '${addEscape(server)}', '${addEscape(threadName)}');
        if (c) {
            pomment.url = c.href;
        }
        pomment.init();
    }
    document.body.appendChild(s);
})();
`;
};
