const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const isVaildEmail = require('email-validator').validate;
const getEditToken = require('../lib/get-salted');
const printLog = require('../lib/log');
const webhook = require('../lib/webhook');
const sendMail = require('../lib/send-mail');
const config = require('../lib/config');
const target = require('../lib/base-path');
const rendTemplate = require('../lib/rend-template');
const structPost = require('../struct/post');
const structThread = require('../struct/thread');
const structPostUnread = require('../struct/post-unread');

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
    const cdPath = path.resolve(target, 'cache/recentIP', ctx.ip);
    let isFirst = false;
    let currentError;

    printLog('debug', `Variable absPath: ${absPath}`);

    // 前置检查
    if (isBlank(info.name)) {
        currentError = 'bad name';
    }
    if (config.common.requiredInfo.email
        && (isBlank(info.email) || !isVaildEmail(info.email))) {
        currentError = 'bad email';
    }
    if (config.common.requiredInfo.website && isBlank(info.website)) {
        currentError = 'bad website';
    }
    if (isBlank(info.content)) {
        currentError = 'bad content';
    }
    if (!fs.existsSync(absPath)) {
        if (isBlank(info.title) && isBlank(info.url)) {
            currentError = 'bad article meta';
        } else {
            fs.copyFileSync(path.resolve(target, 'template/system/thread.db'), absPath);
            isFirst = true;
        }
    }
    if (config.guard.badUserInfo) {
        if (new RegExp(...config.guard.badUserInfo.name).test(info.name)) {
            currentError = 'disallowed name';
        }
        if (new RegExp(...config.guard.badUserInfo.email).test(info.name)) {
            currentError = 'disallowed email';
        }
    }
    if (config.guard.coolDownTimeout >= 0) {
        if (fs.existsSync(cdPath)) {
            const lastly = new Date(fs.readFileSync(cdPath)).getTime();
            const gap = (new Date().getTime() - lastly) / 1000;
            printLog('debug', `lastly: ${lastly}, gap: ${gap}`);
            if (gap < config.guard.coolDownTimeout) {
                ctx.status = 400;
                ctx.response.body = JSON.stringify({ status: 'error', info: 'please wait', timeLeft: config.guard.coolDownTimeout - gap }, null, 4);
                return false;
            }
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
        name: info.name,
        email: info.email || '',
        website: info.website || '',
        parent: info.parent,
        content: info.content,
        moderated: !config.common.moderation,
        hidden: false,
        ip: ctx.ip,
        user_agent: ctx.request.header['user-agent'],
        birth,
        by_admin: false,
        receive_email: info.receiveEmail,
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
    const editToken = config.guard.gusetEditTimeout < 0 ? false : getEditToken(
        info.email,
        ctx.ip,
        ctx.params.name,
        create.dataValues.id,
        birth,
        ctx.userConfig.salt,
    ).digest('hex');
    if (config.guard.coolDownTimeout >= 0) {
        fs.writeFileSync(cdPath, new Date().toISOString());
    }
    const output = {
        status: 'success',
        content: {
            id: create.dataValues.id,
            name: info.name,
            email: info.email || '',
            website: info.website || '',
            parent: info.parent,
            content: info.content,
            moderated: !config.common.moderation,
            birth,
            editToken,
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
        if (config.email.enabled && info.parent >= 0) {
            printLog('info', 'Preparing send email');
            try {
                const parent = await Post.find({
                    attributes: ['name', 'email', 'receive_email'],
                    where: {
                        moderated: true,
                        hidden: false,
                        id: info.parent,
                    },
                });
                printLog('debug', parent.receive_email);
                if (parent.receive_email && parent.receive_email !== '') {
                    printLog('info', 'Sending email');
                    const threadMeta = await thread.find({
                        where: {
                            name: ctx.params.name,
                        },
                    });
                    const templateData = {
                        siteTitle: _.escape(config.common.name),
                        masterName: _.escape(parent.name),
                        url: _.escape(threadMeta.url),
                        title: _.escape(threadMeta.title),
                        name: _.escape(info.name),
                        content: _.escape(content.content).replace(/\n/gm, '<br>'),
                    };
                    const templateString = fs.readFileSync(path.resolve(target, 'template/mail-reply.html'), { encoding: 'utf8' });
                    const mailContent = rendTemplate(templateString, templateData);
                    await sendMail({
                        to: parent.email,
                        subject: rendTemplate(config.email.replyTitle, templateData),
                        // text: '',
                        html: mailContent,
                    });
                }
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
