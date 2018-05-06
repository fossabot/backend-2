const addEscape = target => target.split("'").join("\\'");

module.exports = async (ctx) => {
    const config = ctx.userConfig.info;
    const { script, element, server } = config.frontendLoader;
    const threadName = ctx.params.name;
    ctx.type = 'text/javascript';
    ctx.response.body = `(function () {
    var keyList = ['title', 'avatarPrefix'];
    var e = document.querySelector('${addEscape(element)}');
    var s = document.createElement('script');
    var c = document.querySelector('link[rel=canonical]');
    s.src = '${addEscape(script)}';
    s.onload = function () {
        var pomment = new Pomment(e, '${addEscape(server)}', '${addEscape(threadName)}');
        if (e.dataset.url) {
            pomment.url = e.dataset.url;
        } else if (c) {
            pomment.url = c.href;
        }
        for (var i = 0; i < keyList.length; i++) {
            if (e.dataset[keyList[i]]) {
                pomment[keyList[i]] = e.dataset[keyList[i]];
            }
        }
        pomment.init();
    }
    document.body.appendChild(s);
})();`;
};
