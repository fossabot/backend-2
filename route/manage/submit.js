const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const auth = require('../../lib/auth');
const printLog = require('../../lib/log');
const config = require('../../lib/config');
const target = require('../../lib/base-path');
const structPost = require('../../struct/post');
const sha256 = require('../../lib/get-sha256');
const getIP = require('../../lib/get-ip');
const afterSubmit = require('../../handler/after-submit');

const isBlank = str => (typeof str === 'undefined' || str === null || str.trim() === '');

module.exports = async (ctx) => {
    printLog('debug', `Use route handler ${__filename}`);
    ctx.type = 'application/json';
    const info = ctx.request.body;
    const absPath = path.resolve(target, 'threads', `${sha256(info.url)}.db`);
    let isFirst = false;
    let currentError;
    if (!auth(info.key)) {
        ctx.status = 401;
        ctx.response.body = JSON.stringify({ success: false, info: 'auth failed' }, null, 4);
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
        parent: info.parent,
        content: info.content,
        moderated: true,
        hidden: false,
        ip: getIP(ctx),
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
    const create = await Post.create(content);
    const output = {
        success: true,
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
    afterSubmit({
        Post, info, content, isFirst, create,
    });
    return true;
};
