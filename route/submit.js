const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const isVaildEmail = require('email-validator').validate;
const getEditToken = require('../lib/get-salted');
const printLog = require('../lib/log');
const config = require('../lib/config');
const target = require('../lib/base-path');
const sha256 = require('../lib/get-sha256');
const structPost = require('../struct/post');
const getIP = require('../lib/get-ip');
const afterSubmit = require('../handler/after-submit');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

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
    const cdPath = path.resolve(target, 'cache/recentIP', getIP(ctx));
    let isFirst = false;
    let currentError;

    printLog('debug', `Variable absPath: ${absPath}`);

    // 前置检查
    if (isBlank(info.name)) {
        currentError = 'bad name';
    }
    if (config.common.requireEmail
        && (isBlank(info.email) || !isVaildEmail(info.email))) {
        currentError = 'bad email';
    }
    if (config.common.requireWebsite && isBlank(info.website)) {
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
                ctx.response.body = JSON.stringify({ success: false, info: 'please wait', timeLeft: config.guard.coolDownTimeout - gap }, null, 4);
                return false;
            }
        }
    }
    // 如果前置检查存在没有通过的项目
    if (typeof currentError !== 'undefined') {
        ctx.status = currentError === 'locked' ? 423 : 400;
        ctx.response.body = JSON.stringify({ success: false, info: currentError }, null, 4);
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
        ip: getIP(ctx),
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
    const create = await Post.create(content);
    const editToken = config.guard.gusetEditTimeout < 0 ? false : getEditToken(
        info.email,
        getIP(ctx),
        info.url,
        create.dataValues.id,
        birth,
        ctx.userConfig.salt,
    ).digest('hex');
    if (config.guard.coolDownTimeout >= 0) {
        fs.writeFileSync(cdPath, new Date().toISOString());
    }
    const output = {
        success: true,
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
    afterSubmit({
        Post, info, content, isFirst, create,
    });
    return true;
};
