const path = require('path');
const Sequelize = require('sequelize');
const targetHelper = require('./target-dir');
const printLog = require('./log');
const structPostUnread = require('../struct/post-unread');

/**
 * 更新最近发布的评论
 * @param {string} target - index.db 所在的文件夹
 * @param {string} content - 评论内容
 * @param {string} location - 评论属于哪篇文章
 * @param {string} originID - 评论在对应文章的 ID
 */

module.exports = (target, content, location, originID) => new Promise((resolve, reject) => {
    const indexPath = path.resolve(targetHelper(target), 'index.db');
    const newContent = Object.assign(content);
    newContent.location = location;
    newContent.origin_id = originID;
    printLog('debug', `Use database: ${indexPath}`);
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: indexPath,
        operatorsAliases: false,
    });

    printLog('debug', 'define table `recent`');
    const Post = sequelize.define('recent', structPostUnread, {
        createdAt: false,
        updatedAt: false,
    });
    Post.create(newContent).then(() => {
        printLog('info', 'Success!');
        resolve();
    }, (err) => {
        printLog('error', `An error occurred while adding the data: ${err}`);
        reject();
    });
});
