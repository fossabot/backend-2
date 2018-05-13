const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
const webhook = require('../../lib/webhook');
const sendMail = require('../../lib/send-mail');
const config = require('../../lib/config');
const target = require('../../lib/base-path');
const rendTemplate = require('../../lib/rend-template');
const structPost = require('../../struct/post');
const structThread = require('../../struct/thread');
const structPostUnread = require('../../struct/post-unread');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    const absPath = path.resolve(target, 'threads', `${ctx.params.name}.db`);
    const seq = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: path.resolve(target, 'index.db'),
        operatorsAliases: false,
    });
    let isFirst = false;
    let currentError;
    if (!auth(info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ status: 'error', info: 'auth failed' }, null, 4);
        return false;
    }

    printLog('debug', `Variable absPath: ${absPath}`);

    // 前置检查
    if (!fs.existsSync(absPath)) {
        if (isBlank(info.title) && isBlank(info.url)) {
            currentError = 'bad article meta';
        } else {
            fs.copyFileSync(path.resolve(target, 'template/system/thread.db'), absPath);
            isFirst = true;
        }
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
        name: 'admin',
        parent: info.parent,
        content: info.content,
        moderated: true,
        hidden: false,
        ip: ctx.ip,
        user_agent: ctx.request.header['user-agent'],
        birth,
        by_admin: true,
        receive_email: true,
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
            id: create.dataValues.id,
            parent: info.parent,
            content: info.content,
            moderated: !config.common.moderation,
            birth,
        },
        gusetEditTimeout: config.guard.gusetEditTimeout,
        coolDownTimeout: config.guard.coolDownTimeout,
    };
    ctx.response.body = JSON.stringify(output, null, 4);

    // 客户端处理完毕后，更新评论计数器，增加最近评论
    (async () => {
        printLog('debug', 'Checking post amount');
        const postAmount = Array.from(await Post.findAll({
            where: {
                moderated: true,
                hidden: false,
            },
        })).length;
        const thread = seq.define('thread', structThread);
        printLog('debug', `Post amount: ${postAmount}`);
        try {
            printLog('info', 'Adding unread post');
            const unreadContent = Object.assign({}, content);
            unreadContent.marked = false;
            unreadContent.location = ctx.params.name;
            unreadContent.origin_id = create.dataValues.id;
            const unreadPost = seq.define('recent', structPostUnread, {
                createdAt: false,
                updatedAt: false,
            });
            await unreadPost.create(unreadContent);
            printLog('info', 'Updating counter');
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
        } catch (e) {
            printLog('error', `An error occurred while updating data: ${e}`);
        }
        // 发送邮件
        if (!config.email.enabled && info.parent >= 0) {
            printLog('info', 'Sending email');
            try {
                const parent = await Post.find({
                    attributes: ['email'],
                    where: {
                        moderated: true,
                        hidden: false,
                        id: info.parent,
                    },
                });
                const threadMeta = await thread.find({
                    where: {
                        name: ctx.params.name,
                    },
                });
                const templateData = {
                    siteTitle: _.escape(config.common.siteTitle),
                    masterName: _.escape(parent.name),
                    url: _.escape(threadMeta.url),
                    title: _.escape(threadMeta.title),
                    name: _.escape(config.common.admin.username),
                    content: _.escape(content.content).replace(/\n/gm, '<br>'),
                };
                const mailContent = rendTemplate(fs.readFileSync(path.resolve(target, 'template/mail-reply.html')), templateData);
                await sendMail({
                    to: parent.email,
                    subject: rendTemplate(config.email.replyTitle, templateData),
                    // text: '',
                    html: mailContent,
                });
            } catch (e) {
                printLog('error', `An error occurred while sending E-mail: ${e}`);
            }
        }
        // 处理 webhook
        if (config.common.webhook) {
            printLog('info', 'Sending webhook request');
            try {
                const thre = await thread.find({
                    where: {
                        name: ctx.params.name,
                    },
                });
                const cont = await Post.find({
                    where: {
                        id: create.dataValues.id,
                    },
                });
                await webhook('submit', thre, cont);
            } catch (e) {
                printLog('error', `An error occurred while sending webhook request: ${e}`);
            }
        }
        printLog('info', `All action regarding ${ctx.params.name} done`);
        return true;
    })();
    return true;
};