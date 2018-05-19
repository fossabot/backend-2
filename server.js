const { URL } = require('url');
const Koa = require('koa');
const logger = require('koa-logger');
const rout = require('koa-router')();
const koaBody = require('koa-body');
const argv = require('minimist')(process.argv.slice(2));
const printLog = require('./lib/log');
const randChar = require('./lib/randchar');
const targetHelper = require('./lib/target-dir');
const config = require('./lib/config');
const systemInfo = require('./route/system-info');
const show = require('./route/show');
const edit = require('./route/edit');
const submit = require('./route/submit');
const frontendLoader = require('./route/frontend-loader');
const unknown = require('./route/unknown');
const adminListUnread = require('./route/manage/show-unread');
const adminMarkUnread = require('./route/manage/mark-unread');
const adminShow = require('./route/manage/show');
const adminSetMeta = require('./route/manage/set-meta');
const adminSetPost = require('./route/manage/set-post');
const adminLock = require('./route/manage/lock');
const adminUnlock = require('./route/manage/unlock');
const adminDelete = require('./route/manage/delete');
const adminSubmit = require('./route/manage/submit');
const adminGetSingle = require('./route/manage/get-single');

const salt = randChar(32);
const app = new Koa();

app.use(logger());
app.use(koaBody());

// 用于传值（设置信息）的中间件
app.use((ctx, next) => {
    ctx.userConfig = {
        basePath: targetHelper(argv._[1]),
        salt,
    };
    return next();
});

// referer 校验
app.use((ctx, next) => {
    ctx.set('Access-Control-Request-Method', 'POST');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type');
    if (process.env.POMMENT_DEBUG || typeof ctx.headers.referer === 'undefined') {
        ctx.set('Access-Control-Allow-Origin', '*');
        return next();
    } else if (config.guard.allowedOrigin) {
        let url;
        try {
            url = new URL(ctx.headers.referer);
        } catch (e) {
            ctx.status = 400;
            ctx.response.body = JSON.stringify({ status: 'error', info: 'bad origin' }, null, 4);
            return false;
        }
        const whiteList = config.guard.allowedOrigin;
        for (let i = 0; i < whiteList.length; i += 1) {
            if (url.origin === whiteList[i]) {
                ctx.set('Access-Control-Allow-Origin', whiteList[i]);
                return next();
            }
        }
    }
    ctx.status = 400;
    ctx.response.body = JSON.stringify({ status: 'error', info: 'bad origin' }, null, 4);
    return false;
});

rout.post('/', systemInfo)
    .post('/v1/list', show)
    .post('/v1/submit', submit)
    .post('/v1/edit', edit)
    .get('/v1/loader.js', frontendLoader)
    .post('/v1/manage/list-unread', adminListUnread)
    .post('/v1/manage/mark', adminMarkUnread)
    .post('/v1/manage/list', adminShow)
    .post('/v1/manage/set-meta', adminSetMeta)
    .post('/v1/manage/set-post', adminSetPost)
    .post('/v1/manage/lock', adminLock)
    .post('/v1/manage/unlock', adminUnlock)
    .post('/v1/manage/delete', adminDelete)
    .post('/v1/manage/submit', adminSubmit)
    .post('/v1/manage/get-single', adminGetSingle)
    .post('*', unknown)
    .get('*', unknown)
    .options('*', (ctx) => {
        ctx.response.body = '';
    });

app.use(rout.routes());

module.exports = () => {
    app.listen(config.common.webPort, config.common.webHost);
    printLog('info', `The HTTP server is http://${config.common.webHost}:${config.common.webPort}`);
};
