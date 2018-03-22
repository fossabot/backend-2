const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const isVaildEmail = require('email-validator').validate;
const htmlToText = require('html-to-text');
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
    let currentError;

    printLog('debug', `Variable absPath: ${absPath}`);

    // 前置检查
    if (isBlank(info.name)) {
        currentError = 'bad name';
    }
    if (ctx.userConfig.info.requiredInfo.email
        && (isBlank(info.email) || !isVaildEmail(info.email))) {
        currentError = 'bad email';
    }
    if (ctx.userConfig.info.requiredInfo.website && isBlank(info.website)) {
        currentError = 'bad website';
    }
    if (isBlank(info.content)) {
        currentError = 'bad content';
    }
    if (!fs.existsSync(absPath)) {
        if (isBlank(info.title) && isBlank(info.url)) {
            currentError = 'bad article meta';
        } else {
            fs.copyFileSync(path.resolve(ctx.userConfig.basePath, 'template/thread.db'), absPath);
            isFirst = true;
        }
    }

    // 如果前置检查存在没有通过的项目
    if (typeof currentError !== 'undefined') {
        ctx.status = 400;
        ctx.response.body = JSON.stringify({ status: 'error', info: currentError }, null, 4);
        return false;
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
        await updateCounter(
            ctx.userConfig.basePath,
            ctx.params.name,
            postAmount,
            isFirst,
            info.title,
            info.url,
        );
        printLog('info', 'Updating recent list');
        await addUnread(ctx.userConfig.basePath, content, ctx.params.name, create.dataValues.id);
    } catch (e) {
        printLog('error', `An error occurred while updating counter: ${e}`);
    }

    // 发送邮件
    if (ctx.userConfig.info.mail) {
        printLog('info', 'Sending email');
        const sendMail = option => new Promise((resolve, reject) => {
            ctx.mailTransport.sendMail(option, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        try {
            const mailHtml = fs.readFileSync(path.resolve(ctx.userConfig.basePath, 'mail-template.html'), { encoding: 'utf8' })
                .replace(/{{ siteTitle }}/g, ctx.userConfig.info.name)
                .replace(/{{ articleTitle }}/g, info.title)
                .replace(/{{ articleURL }}/g, info.url)
                .replace(/{{ name }}/g, info.name)
                .replace(/{{ email }}/g, info.email)
                .replace(/{{ website }}/g, info.website)
                .replace(/{{ content }}/g, unHtml(info.content))
                .replace(/{{ ip }}/g, ctx.ip)
                .replace(/{{ userAgent }}/g, ctx.request.header['user-agent']);

            await sendMail({
                from: ctx.userConfig.info.senderMail,
                to: ctx.userConfig.info.adminMail,
                subject: `您的文章 ${info.name} 有了新的回复`,
                text: htmlToText.fromString(mailHtml),
                html: mailHtml,
            });
        } catch (e) {
            printLog('error', `An error occurred while sending email: ${e}`);
        }
    }
    return true;
};
