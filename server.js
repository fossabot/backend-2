const Koa = require('koa');
const logger = require('koa-logger');
const rout = require('koa-router')();
const koaBody = require('koa-body');
const argv = require('minimist')(process.argv.slice(2));
const nodemailer = require('nodemailer');
const getConfig = require('./lib/config');

const show = require('./route/show');
const submit = require('./route/submit');

const app = new Koa();
let mailTransport;
let config;

const unknownCommand = async (ctx) => {
    console.log(ctx.userConfig);
    ctx.response.body = JSON.stringify({
        api_version: 1,
        required_info: ctx.userConfig.info.requiredInfo,
        documentation_url: 'https://www.example.com',
    }, null, 4);
};

app.use(logger());
app.use(koaBody());

// 用于传值（设置信息）的中间件
app.use((ctx, next) => {
    ctx.userConfig = config;
    ctx.mailTransport = mailTransport;
    return next();
});

rout.get('/', unknownCommand)
    .get('/v1/thread/:name', show)
    .post('/v1/thread/:name/submit', submit);
app.use(rout.routes());

module.exports = (webPort) => {
    config = getConfig(argv._[1]);
    mailTransport = nodemailer.createTransport(config.info.mail);
    app.listen(webPort);
};
