const Koa = require('koa');
const logger = require('koa-logger');
const rout = require('koa-router')();
const koaBody = require('koa-body');
const beautify = require('json-beautify');
// const printLog = require('./lib/log');

const showThread = require('./route/show-thread');

const app = new Koa();

const unknownCommand = async (ctx) => {
    ctx.response.body = beautify({
        message: 'Unknown command',
        documentation_url: 'https://www.example.com',
    }, null, 4);
};

app.use(logger());
app.use(koaBody());
rout.get('/', unknownCommand)
    .get('/v1/thread/:name', showThread);
app.use(rout.routes());

module.exports = app;
