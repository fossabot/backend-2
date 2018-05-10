const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const printLog = require('./log');
const targetHelper = require('./target-dir');
const argv = require('minimist')(process.argv.slice(2));
const structPost = require('../struct/post');

module.exports = async (target) => {
    const tempDir = path.resolve(targetHelper(target), 'template');
    const tempThread = path.resolve(tempDir, 'system/thread.db');
    if (argv.debug) {
        printLog('debug', 'Remove template directory');
        fs.removeSync(tempDir);
    }
    printLog('debug', 'Creating cache directory (if not exist)');
    fs.mkdirpSync(path.resolve(targetHelper(target), 'cache/recentIP'));
    printLog('debug', 'Creating template directory (if not exist)');
    fs.mkdirpSync(path.resolve(tempDir, 'system'));
    printLog('debug', 'Copying default mail template (if not exist)');
    fs.copyFileSync(path.resolve(__dirname, '../assets/template/mail-reply.html'), path.resolve(tempDir, 'mail-reply.html'));
    printLog('debug', 'Creating warning file (if not exist)');
    fs.writeFileSync(path.resolve(tempDir, 'DO_NOT_MODIFY'), '');

    // 建表（如果没有
    if (!fs.existsSync(tempThread)) {
        printLog('debug', 'Creating template database');
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: tempThread,
            operatorsAliases: false,
        });
        sequelize.define('post', structPost, {
            createdAt: false,
            updatedAt: false,
        });
        sequelize.sync({ force: true }).then(() => {
            printLog('info', 'Success!');
        }, (err) => {
            printLog('error', `An error occurred while creating the table: ${err}`);
        });
    }
};
