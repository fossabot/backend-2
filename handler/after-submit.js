const Sequelize = require('sequelize');
const _ = require('lodash');
const config = require('../lib/config');
const fs = require('fs-extra');
const htmlToText = require('html-to-text');
const path = require('path');
const printLog = require('../lib/log');
const rendTemplate = require('../lib/rend-template');
const sendMail = require('../lib/send-mail');
const structPostUnread = require('../struct/post-unread');
const structThread = require('../struct/thread');
const target = require('../lib/base-path');
const webhook = require('../lib/webhook');

const afterSubmit = async ({
    Post, info, content, isFirst, create,
} = {}) => {
    printLog('debug', 'Checking post amount');
    const postAmount = Array.from(await Post.findAndCountAll({
        moderated: true,
        hidden: false,
    })).length;
    const seq = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: path.resolve(target, 'index.db'),
        operatorsAliases: false,
    });
    const thread = seq.define('thread', structThread);
    printLog('debug', `Post amount: ${postAmount}`);
    printLog('info', 'Adding unread post');
    const unreadContent = Object.assign({}, content);
    unreadContent.marked = false;
    unreadContent.location = info.url;
    unreadContent.origin_id = create.dataValues.id;
    const unreadPost = seq.define('recent', structPostUnread, {
        createdAt: false,
        updatedAt: false,
    });
    await unreadPost.create(unreadContent);
    printLog('info', 'Updating counter');
    if (isFirst) {
        await thread.create({
            url: info.url,
            post: postAmount,
            title: info.title,
        });
    } else {
        await thread.update({
            post: postAmount,
        }, {
            where: { url: info.url },
        });
    }
    // 发送邮件
    if (config.email.enabled && info.parent >= 0) {
        printLog('info', 'Preparing send email');
        const parent = await Post.find({
            attributes: ['name', 'email', 'by_admin', 'receive_email'],
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
                    url: info.url,
                },
            });
            const templateData = {
                siteTitle: _.escape(config.common.name),
                masterName:
                        _.escape(parent.by_admin ? parent.name : config.common.admin.username),
                url: _.escape(threadMeta.url),
                title: _.escape(threadMeta.title),
                name: _.escape(info.name),
                content: _.escape(content.content).replace(/\n/gm, '<br>'),
            };
            const templateString = fs.readFileSync(path.resolve(target, 'template/mail-reply.html'), { encoding: 'utf8' });
            const mailContent = rendTemplate(templateString, templateData);
            await sendMail({
                to: parent.by_admin ? config.common.admin.email : parent.email,
                subject: rendTemplate(config.email.replyTitle, templateData),
                text: htmlToText.fromString(mailContent),
                html: mailContent,
            });
        }
    }
    // 处理 webhook
    if (config.common.webhook) {
        printLog('info', 'Sending webhook request');
        const thre = await thread.find({
            where: {
                url: info.url,
            },
        });
        const cont = await Post.find({
            where: {
                id: create.dataValues.id,
            },
        });
        if (cont.by_admin) {
            cont.name = config.common.admin.username;
            cont.email = config.common.admin.email;
        }
        await webhook('submit', thre, cont);
    }
    printLog('info', `All action regarding ${info.url} done`);
    return true;
};

module.exports = afterSubmit;
