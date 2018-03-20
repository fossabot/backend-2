const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const isVaildEmail = require('email-validator').validate;
const printLog = require('../lib/log');
const unHtml = require('../lib/unhtml');
const updateCounter = require('../lib/update-counter');
const addUnread = require('../lib/add-unread');
const structPost = require('../struct/post');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';

    const info = ctx.request.body;
    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    let isFirst = false;
    printLog('debug', `Variable absPath: ${absPath}`);

    // 前置检查
    if (isBlank(info.name)) {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'invaild name' }, null, 4);
        return false;
    }
    if (ctx.userConfig.info.requiredInfo.email
        && (isBlank(info.email) || !isVaildEmail(info.email))) {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'invaild email' }, null, 4);
        return false;
    }
    if (ctx.userConfig.info.requiredInfo.website && isBlank(info.website)) {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'invaild website' }, null, 4);
        return false;
    }
    if (isBlank(info.content)) {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'invaild content' }, null, 4);
        return false;
    }

    if (!fs.existsSync(absPath)) {
        fs.copyFileSync(path.resolve(ctx.userConfig.basePath, 'template/thread.db'), absPath);
        isFirst = true;
    }

    // 数据添加准备
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: absPath,
        operatorsAliases: false,
    });
    const birth = new Date();
    const content = {
        name: info.name,
        email: info.email || '',
        website: info.website || '',
        parent: info.parent,
        content: unHtml(info.content),
        moderated: !ctx.userConfig.moderation,
        hidden: false,
        ip: ctx.ip,
        user_agent: ctx.request.header['user-agent'],
        birth,
    };

    // 添加数据
    printLog('debug', 'define table `post`');
    const Post = sequelize.define('post', structPost, {
        createdAt: false,
        updatedAt: false,
    });
    let create;
    try {
        create = await Post.create(content);
    } catch (e) {
        printLog('error', `An error occurred while adding the data: ${e}`);
        ctx.status = 500;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'add comment failed' }, null, 4);
        return false;
    }
    const output = {
        status: 'success',
        content: {
            name: info.name,
            email: info.email || '',
            website: info.website || '',
            parent: info.parent,
            content: unHtml(info.content),
            moderated: !ctx.userConfig.moderation,
            birth,
        },
    };
    ctx.response.body = JSON.stringify(output, null, 4);

    // 客户端处理完毕后，更新评论计数器，增加最近评论
    printLog('debug', 'Checking post amount');
    const postAmount = Array.from(await Post.findAll({
        where: {
            moderated: true,
            hidden: false,
        },
    })).length;
    printLog('debug', `Post amount: ${postAmount}`);
    try {
        printLog('info', 'Updating counter');
        await updateCounter(ctx.userConfig.basePath, ctx.params.name, postAmount, isFirst);
        printLog('info', 'Updating recent list');
        await addUnread(ctx.userConfig.basePath, content, ctx.params.name, create.dataValues.id);
    } catch (e) {
        printLog('error', `An error occurred while doing the after-client progress: ${e}`);
    }

    // 发送邮件
    /* if (ctx.userConfig.info.mail) {
        const sendMail = option => new Promise((resolve, reject) => {
            ctx.mailTransport.sendMail(option, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } */
    return true;
};
