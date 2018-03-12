const Sequelize = require('sequelize');
const printLog = require('./log');

module.exports = dbPath => new Promise((resolve, reject) => {
    printLog('debug', `Use database: ${dbPath}`);
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: dbPath,
        operatorsAliases: false,
    });

    printLog('debug', 'define table `post`');
    sequelize.define('post', {
        name: {
            type: Sequelize.STRING(128),
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        avatar: {
            type: Sequelize.TEXT(),
            allowNull: true,
        },
        website: {
            type: Sequelize.TEXT(),
            allowNull: true,
        },
        parent: {
            type: Sequelize.INTEGER(),
            allowNull: true,
        },
        content: {
            type: Sequelize.TEXT(),
            allowNull: false,
        },
        hash: {
            type: Sequelize.CHAR(64),
            allowNull: true,
        },
        moderated: {
            type: Sequelize.BOOLEAN(),
            allowNull: false,
        },
        ip: {
            type: Sequelize.CHAR(48),
            allowNull: true,
        },
        user_agent: {
            type: Sequelize.TEXT(),
            allowNull: true,
        },
    });

    printLog('info', 'Syncing the table');
    sequelize.sync({ force: true }).then(
        () => {
            printLog('info', 'Success!');
            resolve();
        },
        (err) => {
            printLog('error', `An error occurred while creating the table: ${err}`);
            reject();
        },
    );
});
