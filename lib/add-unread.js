const Sequelize = require('sequelize');
const printLog = require('./log');
const structPostUnread = require('../struct/post-unread');

module.exports = (dbPath, content) => new Promise((resolve, reject) => {
    printLog('debug', `Use database: ${dbPath}`);
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: dbPath,
        operatorsAliases: false,
    });

    printLog('debug', 'define table `recent`');
    const Post = sequelize.define('recent', structPostUnread);
    Post.create(newContent);
});
