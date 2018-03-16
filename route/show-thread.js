const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const beautify = require('json-beautify');
const printLog = require('../lib/log');
const structPost = require('../struct/post');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    ctx.response.body = 'application/json';

    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    printLog('debug', `Variable absPath: ${absPath}`);
    if (fs.existsSync(absPath)) {
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: absPath,
            operatorsAliases: false,
        });

        const Post = sequelize.define('post', structPost);
        const content = await Post.findAll({
            attributes: ['name', 'email', 'website', 'parent', 'content'],
            where: {
                moderated: true,
                hidden: false,
            },
        });
        console.log(content);

        ctx.response.body = beautify({
            name: ctx.params.name,
            content,
        }, null, 4);
        // TODO: 若干 SQL 逻辑
    } else {
        ctx.response.body = beautify({
            name: ctx.params.name,
            content: {},
        }, null, 4);
    }
};
