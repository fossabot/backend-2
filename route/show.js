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
        try {
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
                attributes: ['id', 'name', 'email', 'website', 'parent', 'birth', 'content'],
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
                locked: fs.existsSync(path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.lock`)),
                required_info: ctx.userConfig.info.requiredInfo,
                content,
            }, null, 4);
        } catch (e) {
            printLog('error', `An error occurred while showing post: ${e}`);
            ctx.status = 500;
            ctx.response.body = JSON.stringify({ status: 'error', info: 'list unread post failed' }, null, 4);
            return false;
        }
    } else {
        ctx.response.body = JSON.stringify({
            status: 'success',
            name: ctx.params.name,
            locked: false,
            required_info: ctx.userConfig.info.requiredInfo,
            content: {},
        }, null, 4);
    }
    return true;
};
