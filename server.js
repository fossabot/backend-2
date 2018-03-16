const Koa = require('koa');
const logger = require('koa-logger');
const rout = require('koa-router')();
const koaBody = require('koa-body');
const argv = require('minimist')(process.argv.slice(2));
const getConfig = require('./lib/config');

const show = require('./route/show');
const submit = require('./route/submit');

const app = new Koa();
let config;

const unknownCommand = async (ctx) => {
    ctx.response.body = JSON.stringify({
        message: 'Unknown command',
        documentation_url: 'https://www.example.com',
    }, null, 4);
};

app.use(logger());
app.use(koaBody());

// 用于传值（设置信息）的中间件
app.use((ctx, next) => {
    ctx.userConfig = config;
    return next();
});

rout.get('/', unknownCommand)
    .get('/v1/thread/:name', show)
    .post('/v1/thread/:name/submit', submit);
app.use(rout.routes());

module.exports = (webPort) => {
    config = getConfig(argv._[1]);
    app.listen(webPort);
};
