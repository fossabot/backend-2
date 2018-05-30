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
    ctx.type = 'application/json';
    const info = ctx.request.body;
    printLog('debug', `Use route handler ${__filename}`);
    if (!info.url) {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ success: false, info: 'invaild url' }, null, 4);
        return false;
    }
    const absPath = path.resolve(target, 'threads', `${sha256(info.url)}.db`);
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
                newItem.dataValues.website = null;
            }
            // 电子邮件 md5
            if (newItem.name) {
                const emailHashed = crypto.createHash('md5');
                emailHashed.update(newItem.email);
                newItem.dataValues.emailHashed = emailHashed.digest('hex');
            } else {
                newItem.dataValues.emailHashed = null;
                newItem.dataValues.website = null;
            }
            delete newItem.dataValues.email;
            content.push(newItem);
        });

        ctx.response.body = JSON.stringify({
            success: true,
            name: info.url,
            locked: fs.existsSync(path.resolve(target, 'threads', `${sha256(info.url)}.lock`)),
            required_info: config.common.requiredInfo,
            content,
        }, null, 4);
    } else {
        ctx.response.body = JSON.stringify({
            success: true,
            name: info.url,
            locked: false,
            required_info: config.common.requiredInfo,
            content: [],
        }, null, 4);
    }
    return true;
};
