const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const beautify = require('json-beautify');
const printLog = require('../lib/log');
const randChar = require('../lib/randchar');
const unHtml = require('../lib/unhtml');
const updateCounter = require('../lib/update-counter');
const structPost = require('../struct/post');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    const info = ctx.request.body;
    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    let isFirst = false;
    printLog('debug', `Variable absPath: ${absPath}`);

    if (!fs.existsSync(absPath)) {
        fs.copyFileSync(path.resolve(ctx.userConfig.basePath, 'template/thread.db'), absPath);
        isFirst = true;
    }

    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: absPath,
        operatorsAliases: false,
    });

    printLog('debug', 'define table `post`');
    const Post = sequelize.define('post', structPost);
    const hash = randChar(16);
    await Post.create({
        name: info.name,
        email: info.email,
        website: info.website,
        parent: info.parent,
        content: unHtml(info.content),
        hash,
        moderated: false,
        hidden: false,
        ip: ctx.ip,
        user_agent: ctx.request.header['user-agent'],
    });
    const output = {
        status: 'success',
        content: {
            name: info.name,
            email: info.email,
            website: info.website,
            parent: info.parent,
            content: unHtml(info.content),
            hash,
            moderated: false,
        },
    };
    ctx.type = 'application/json';
    ctx.response.body = beautify(output, null, 4);

    // 客户端处理完毕后
    printLog('debug', 'Checking post amount');
    const postAmount = Array.from(await Post.findAll({
        where: {
            moderated: false,
        },
    })).length;
    printLog('debug', `Post amount: ${postAmount}`);

    printLog('debug', 'Updating counter');
    updateCounter(ctx.userConfig.basePath, ctx.params.name, postAmount, isFirst);
};
