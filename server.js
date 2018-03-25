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

const adminShow = require('./route/manage/show');

const app = new Koa();
let mailTransport;
let config;

app.use(logger());
app.use(koaBody());

// 用于传值（设置信息）的中间件
app.use((ctx, next) => {
    ctx.userConfig = config;
    ctx.mailTransport = mailTransport;
    return next();
});

rout.get('/', systemInfo)
    .get('/v1/thread/:name/list', show)
    .post('/v1/thread/:name/submit', submit)
    .post('/v1/manage/thread/:name/list', adminShow)
    .get('*', unknown);

app.use(rout.routes());

module.exports = (webPort) => {
    config = getConfig(argv._[1]);
    mailTransport = nodemailer.createTransport(config.info.mail);
    app.listen(webPort);
};
