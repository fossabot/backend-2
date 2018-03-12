const Sequelize = require('sequelize');
const printLog = require('./log');

module.exports = dbPath => new Promise((resolve, reject) => {
    printLog('debug', `Use database: ${dbPath}`);
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: dbPath,
        operatorsAliases: false,
    });

    printLog('debug', 'define table `thread`');
    sequelize.define('thread', {
        name: {
            type: Sequelize.STRING(),
            allowNull: false,
            unique: true,
        },
        post: {
            type: Sequelize.INTEGER(),
            allowNull: false,
        },
        post_display: {
            type: Sequelize.INTEGER(),
            allowNull: false,
        },
    });

    printLog('debug', 'define table `recent`');
    sequelize.define('recent', {
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
        ip: {
            type: Sequelize.CHAR(48),
            allowNull: true,
        },
        user_agent: {
            type: Sequelize.TEXT(),
            allowNull: true,
        },
        location: {
            type: Sequelize.TEXT(),
            allowNull: false,
        },
        origin_id: {
            type: Sequelize.INTEGER(),
            allowNull: false,
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
