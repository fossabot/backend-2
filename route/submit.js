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
const structPost = require('../struct/post');
const structThread = require('../struct/thread');
const structPostUnread = require('../struct/post-unread');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    const absPath = path.resolve(target, 'threads', `${ctx.params.name}.db`);
    const cdPath = path.resolve(target, 'cache/recentIP', ctx.ip);
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
            fs.copyFileSync(path.resolve(target, 'template/thread.db'), absPath);
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
    if (config.coolDownTimeout >= 0) {
        if (fs.existsSync(cdPath)) {
            const lastly = new Date(fs.readFileSync(cdPath)).getTime();
            const gap = (new Date().getTime() - lastly) / 1000;
            printLog('debug', `lastly: ${lastly}, gap: ${gap}`);
            if (gap < config.coolDownTimeout) {
                ctx.status = 400;
                ctx.response.body = JSON.stringify({ status: 'error', info: 'please wait', timeLeft: config.coolDownTimeout - gap }, null, 4);
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
        moderated: !config.moderation,
        hidden: false,
        ip: ctx.ip,
        user_agent: ctx.request.header['user-agent'],
        birth,
        by_admin: false,
        receive_email: typeof info.receiveEmail === 'boolean' ? info.receiveEmail : true,
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
    const editToken = config.gusetEditTimeout < 0 ? false : getEditToken(
        info.email,
        ctx.ip,
        ctx.params.name,
        create.dataValues.id,
        birth,
        ctx.userConfig.salt,
    );
    if (config.coolDownTimeout >= 0) {
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
            moderated: !config.moderation,
            birth,
            editToken,
        },
        gusetEditTimeout: config.gusetEditTimeout,
        coolDownTimeout: config.coolDownTimeout,
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
        printLog('debug', `Post amount: ${postAmount}`);
        try {
            const seq = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage: path.resolve(target, 'index.db'),
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
        } catch (e) {
            printLog('error', `An error occurred while updating data: ${e}`);
        }
        // 发送邮件
        if (config.mail) {
            printLog('info', 'Sending E-mail');
            try {
                await sendMail({
                    to: '',
                    subject: '',
                    text: '',
                    html: '',
                });
            } catch (e) {
                printLog('error', `An error occurred while sending E-mail: ${e}`);
            }
        }
        // 处理 webhook
        if (config.webhook) {
            printLog('info', 'Sending webhook request');
            try {
                await webhook('submit', content);
            } catch (e) {
                printLog('error', `An error occurred while sending webhook request: ${e}`);
            }
        }
        printLog('info', `All action regarding ${ctx.params.name} done`);
        return true;
    })();
    return true;
};
