const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const printLog = require('../lib/log');
const structPost = require('../struct/post');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';

    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    printLog('debug', `Variable absPath: ${absPath}`);
    if (fs.existsSync(absPath)) {
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: absPath,
            operatorsAliases: false,
        });

        const Post = sequelize.define('post', structPost, {
            createdAt: false,
            updatedAt: false,
        });
        const content = [];
        const tmpContent = await Post.findAll({
            attributes: ['name', 'email', 'website', 'parent', 'birth', 'content'],
            where: {
                moderated: true,
                hidden: false,
            },
        });

        Array.from(tmpContent).forEach((item) => {
            const newItem = item;
            const emailHashed = crypto.createHash('md5');
            emailHashed.update(newItem.email);
            newItem.dataValues.emailHashed = emailHashed.digest('hex');
            delete newItem.dataValues.email;
            content.push(newItem);
        });

        ctx.response.body = JSON.stringify({
            status: 'success',
            name: ctx.params.name,
            content,
        }, null, 4);
    } else {
        ctx.response.body = JSON.stringify({
            status: 'success',
            name: ctx.params.name,
            content: {},
        }, null, 4);
    }
};
