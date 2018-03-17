const path = require('path');
const Sequelize = require('sequelize');
const targetHelper = require('./target-dir');
const printLog = require('./log');
const structPostUnread = require('../struct/post-unread');

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
