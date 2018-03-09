const Koa = require('koa');
const logger = require('koa-logger');
const rout = require('koa-router')();
const koaBody = require('koa-body');
const printLog = require('./lib/log');

const app = new Koa();

async function list(ctx) {
    console.log(ctx);
    ctx.response.body = 'Hello World';
}

async function show(ctx) {
    ctx.response.body = `Hello World! id: ${ctx.params.id}`;
}

app.use(logger());
app.use(koaBody());
rout.get('/', list)
    .get('/post/:id', show);
app.use(rout.routes());

module.exports = app;
