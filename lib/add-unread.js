const Sequelize = require('sequelize');
const printLog = require('./log');
const structPostUnread = require('../struct/post-unread');

module.exports = (dbPath, content, location, originID) => new Promise((resolve, reject) => {
    const newContent = Object.assign(content);
    newContent.location = location;
    newContent.origin_id = originID;
    printLog('debug', `Use database: ${dbPath}`);
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: dbPath,
        operatorsAliases: false,
    });

    printLog('debug', 'define table `recent`');
    const Post = sequelize.define('recent', structPostUnread, {
        createdAt: false,
        updatedAt: false,
    });
    Post.create(newContent);
});
