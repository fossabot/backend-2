const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const isVaildEmail = require('email-validator').validate;
const htmlToText = require('html-to-text');
const request = require('request');
const printLog = require('../lib/log');
const unHtml = require('../lib/unhtml');
const structPost = require('../struct/post');
const structThread = require('../struct/thread');
const structPostUnread = require('../struct/post-unread');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    const config = ctx.userConfig.info;
    const absPath = path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.db`);
    let isFirst = false;
    let currentError;

    printLog('debug', `Variable absPath: ${absPath}`);

    // 前置检查
    if (isBlank(info.name)) {
        currentError = 'bad name';
    }
    if (config.requiredInfo.email
        && (isBlank(info.email) || !isVaildEmail(info.email))) {
        currentError = 'bad email';
    }
    if (config.requiredInfo.website && isBlank(info.website)) {
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
    if (config.badUserInfo) {
        if (new RegExp(...config.badUserInfo.name).test(info.name)) {
            currentError = 'disallowed name';
        }
        if (new RegExp(...config.badUserInfo.email).test(info.name)) {
            currentError = 'disallowed email';
        }
    }
    if (fs.existsSync(path.resolve(ctx.userConfig.basePath, 'threads', `${ctx.params.name}.lock`))) {
        currentError = 'locked';
    }
    // 如果前置检查存在没有通过的项目
    if (typeof currentError !== 'undefined') {
        ctx.status = currentError === 'locked' ? 423 : 400;
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
    (async () => {
        let mailMeta;

        printLog('debug', 'Checking post amount');
        const postAmount = Array.from(await Post.findAll({
            where: {
                moderated: true,
                hidden: false,
            },
        })).length;
        printLog('debug', `Post amount: ${postAmount}`);
        try {
            const seq = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage: path.resolve(ctx.userConfig.basePath, 'index.db'),
                operatorsAliases: false,
            });

            printLog('info', 'Adding unread post');
            const unreadContent = Object.assign(content);
            unreadContent.marked = false;
            unreadContent.location = ctx.params.name;
            unreadContent.origin_id = create.dataValues.id;
            const unreadPost = seq.define('recent', structPostUnread, {
                createdAt: false,
                updatedAt: false,
            });
            await unreadPost.create(unreadContent);

            printLog('info', 'Updating counter');
            const thread = seq.define('thread', structThread);
            if (isFirst) {
                await thread.create({
                    name: ctx.params.name,
                    post: postAmount,
                    title: info.title,
                    url: info.url,
                });
            } else {
                await thread.update({
                    post: postAmount,
                }, {
                    where: { name: ctx.params.name },
                });
            }
            if (config.mail) {
                mailMeta = await thread.find({
                    attributes: ['title', 'url'],
                    where: {
                        name: ctx.params.name,
                    },
                });
            }
        } catch (e) {
            printLog('error', `An error occurred while updating data: ${e}`);
        }

        // 发送邮件
        if (config.mail) {
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
                const mailHtml = fs.readFileSync(path.resolve(ctx.userConfig.basePath, 'mail-template-admin.html'), { encoding: 'utf8' })
                    .replace(/{{ siteTitle }}/g, config.name)
                    .replace(/{{ articleTitle }}/g, mailMeta.dataValues.title)
                    .replace(/{{ articleURL }}/g, mailMeta.dataValues.url)
                    .replace(/{{ name }}/g, info.name)
                    .replace(/{{ email }}/g, info.email)
                    .replace(/{{ website }}/g, info.website)
                    .replace(/{{ content }}/g, unHtml(info.content))
                    .replace(/{{ ip }}/g, ctx.ip)
                    .replace(/{{ userAgent }}/g, ctx.request.header['user-agent']);

                await sendMail({
                    from: config.senderMail,
                    to: config.adminMail,
                    subject: `【${config.name}】您的文章 ${info.title} 有了新的回复`,
                    text: htmlToText.fromString(mailHtml),
                    html: mailHtml,
                });
            } catch (e) {
                printLog('error', `An error occurred while sending email: ${e}`);
            }
        }
        if (config.webhook) {
            printLog('info', 'Sending webhook request');
            request({
                url: config.webhook,
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(content),
            }, (e, response, body) => {
                if (!e && response.statusCode === 200) {
                    printLog('info', `Result: ${body}`);
                } else {
                    printLog('error', `An error occurred while sending webhook request: ${e}`);
                }
            });
        }
        printLog('info', `All action regarding ${ctx.params.name} done`);
        return true;
    })();
    return true;
};
