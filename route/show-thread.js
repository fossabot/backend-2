const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const beautify = require('json-beautify');
const printLog = require('../lib/log');
const structPost = require('../struct/post');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    const absPath = p => path.resolve(ctx.userConfig.basePath, 'threads', `${p}.db`);
    ctx.type = 'application/json';
    if (fs.existsSync(absPath(ctx.params.name))) {
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: absPath,
            operatorsAliases: false,
        });

        const Post = sequelize.define('post', structPost);
        Post.findAll({
            attributes: ['name', 'email', 'website', 'parent', 'content'],
            where: {
                moderated: true,
                hidden: false,
            },
        });

        ctx.response.body = beautify({
            name: ctx.params.name,
            exist: true,
        }, null, 4);
        // TODO: 若干 SQL 逻辑
    } else {
        ctx.response.body = beautify({
            name: ctx.params.name,
            content: {},
        }, null, 4);
    }
};
