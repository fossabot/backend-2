const Koa = require('koa');
const logger = require('koa-logger');
const rout = require('koa-router')();
const koaBody = require('koa-body');
const argv = require('minimist')(process.argv.slice(2));
const nodemailer = require('nodemailer');
const getConfig = require('./lib/config');

const systemInfo = require('./route/system-info');
const show = require('./route/show');
const submit = require('./route/submit');
const unknown = require('./route/unknown');
const adminListUnread = require('./route/manage/show-unread');
const adminShow = require('./route/manage/show');
const adminSetMeta = require('./route/manage/set-meta');
const adminSetPost = require('./route/manage/set-post');
const adminLock = require('./route/manage/lock');
const adminUnlock = require('./route/manage/unlock');
const adminDelete = require('./route/manage/delete');

const app = new Koa();
let mailTransport;
let config;

app.use(logger());
app.use(koaBody());

// 用于传值（设置信息）的中间件
app.use((ctx, next) => {
    ctx.userConfig = config;
    if (config.info.mail) ctx.mailTransport = mailTransport;
    return next();
});

rout.post('/', systemInfo)
    .post('/v1/thread/:name/list', show)
    .post('/v1/thread/:name/submit', submit)
    .post('/v1/manage/unread/list', adminListUnread)
    .post('/v1/manage/thread/:name/list', adminShow)
    .post('/v1/manage/thread/:name/setMeta', adminSetMeta)
    .post('/v1/manage/thread/:name/setPost', adminSetPost)
    .post('/v1/manage/thread/:name/lock', adminLock)
    .post('/v1/manage/thread/:name/unlock', adminUnlock)
    .post('/v1/manage/thread/:name/delete', adminDelete)
    .post('*', unknown)
    .get('*', unknown);

app.use(rout.routes());

module.exports = (webPort) => {
    config = getConfig(argv._[1]);
    if (config.info.mail) mailTransport = nodemailer.createTransport(config.info.mail);
    app.listen(webPort);
};
