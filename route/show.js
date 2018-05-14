const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const printLog = require('../lib/log');
const target = require('../lib/base-path');
const config = require('../lib/config');
const structPost = require('../struct/post');
const sha256 = require('../lib/get-sha256');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    const absPath = path.resolve(target, 'threads', `${sha256(info.url)}.db`);
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
                attributes: ['id', 'name', 'email', 'website', 'parent', 'birth', 'content', 'by_admin'],
                where: {
                    moderated: true,
                    hidden: false,
                },
            });

            Array.from(tmpContent).forEach((item) => {
                const newItem = item;
                // 管理员信息
                if (newItem.by_admin) {
                    newItem.dataValues.name = config.common.admin.username;
                    newItem.dataValues.email = config.common.admin.email;
                }
                // 电子邮件 md5
                const emailHashed = crypto.createHash('md5');
                emailHashed.update(newItem.email);
                newItem.dataValues.emailHashed = emailHashed.digest('hex');
                delete newItem.dataValues.email;
                content.push(newItem);
            });

            ctx.response.body = JSON.stringify({
                status: 'success',
                name: info.url,
                locked: fs.existsSync(path.resolve(target, 'threads', `${info.url}.lock`)),
                required_info: config.common.requiredInfo,
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
            name: info.url,
            locked: false,
            required_info: config.common.requiredInfo,
            content: [],
        }, null, 4);
    }
    return true;
};
