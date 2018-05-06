const addEscape = target => target.split("'").join("\\'");

module.exports = async (ctx) => {
    const config = ctx.userConfig.info;
    const { element, server, script } = config.frontendLoader;
    const threadName = ctx.params.name;
    ctx.type = 'text/javascript';
    ctx.response.body = `(function () {
    var s = document.createElement('script');
    s.src = '${addEscape(script)}';
    s.onload = function () {
        new Pomment(
            '${addEscape(element)}',
            '${addEscape(server)}',
            '${addEscape(threadName)}'
        ).init();
    }
    document.body.appendChild(s);
})();`;
};
