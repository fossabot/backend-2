const logger = require('koa-logger');
const router = require('koa-router')();
const koaBody = require('koa-body');

const Koa = require('koa');
const app = module.exports = new Koa();

app.use(logger());
app.use(koaBody());

router.get('/', list)
    .get('/post/:id', show)

app.use(router.routes());

async function list(ctx) {
    console.log(ctx);
    ctx.response.body = 'Hello World';
}

async function show(ctx) {
    ctx.response.body = 'Hello World! id: ' + ctx.params.id;
}

if (!module.parent) app.listen(3000);