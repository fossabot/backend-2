const Sequelize = require('sequelize');
const printLog = require('../lib/log');
const structPostUnread = require('../struct/post-unread');
const structThread = require('../struct/thread');

module.exports = dbPath => new Promise((resolve, reject) => {
    printLog('debug', `Use database: ${dbPath}`);
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: dbPath,
        operatorsAliases: false,
    });

    printLog('debug', 'define table `thread`');
    sequelize.define('thread', structThread);

    printLog('debug', 'define table `recent`');
    sequelize.define('recent', structPostUnread, {
        createdAt: false,
        updatedAt: false,
    });

    printLog('info', 'Syncing the table');
    sequelize.sync({ force: true }).then(() => {
        printLog('info', 'Success!');
        resolve();
    }, (err) => {
        printLog('error', `An error occurred while creating the table: ${err}`);
        reject();
    });
});
