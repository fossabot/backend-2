const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const printLog = require('../lib/log');
const randChar = require('../lib/randchar');
const structPost = require('../struct/post');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    const info = ctx.request.body;
    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    printLog('debug', `Variable absPath: ${absPath}`);

    if (!fs.existsSync(absPath)) {
        fs.copyFileSync(path.resolve(ctx.userConfig.basePath, 'template/thread.db'), absPath);
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
        content: info.content,
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
            content: info.content,
            hash,
            moderated: false,
        },
    };
    ctx.type = 'application/json';
    ctx.response.body = output;
    console.log(ctx.userConfig);
};
