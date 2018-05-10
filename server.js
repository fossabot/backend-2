const Koa = require('koa');
const logger = require('koa-logger');
const rout = require('koa-router')();
const koaBody = require('koa-body');
const argv = require('minimist')(process.argv.slice(2));
const printLog = require('./lib/log');
const randChar = require('./lib/randchar');
const targetHelper = require('./lib/target-dir');
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
    if (argv.debug) {
        ctx.set('Access-Control-Allow-Origin', '*');
    }
    ctx.set('Access-Control-Request-Method', 'POST');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type');
    return next();
});

rout.post('/', systemInfo)
    .post('/v1/thread/:name/list', show)
    .post('/v1/thread/:name/submit', submit)
    .post('/v1/thread/:name/edit', edit)
    .get('/v1/thread/:name/loader.js', frontendLoader)
    .post('/v1/manage/unread/list', adminListUnread)
    .post('/v1/manage/unread/mark', adminMarkUnread)
    .post('/v1/manage/thread/:name/list', adminShow)
    .post('/v1/manage/thread/:name/setMeta', adminSetMeta)
    .post('/v1/manage/thread/:name/setPost', adminSetPost)
    .post('/v1/manage/thread/:name/lock', adminLock)
    .post('/v1/manage/thread/:name/unlock', adminUnlock)
    .post('/v1/manage/thread/:name/delete', adminDelete)
    .post('*', unknown)
    .get('*', unknown)
    .options('*', (ctx) => {
        ctx.response.body = '';
    });

app.use(rout.routes());

module.exports = (webPort) => {
    const webHost = argv.debug ? '0.0.0.0' : '127.0.0.1';
    app.listen(webPort, webHost);
    printLog('info', `The HTTP server is http://${webHost}:${webPort}`);
};
