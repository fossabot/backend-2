const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const printLog = require('./log');
const targetHelper = require('./target-dir');
const argv = require('minimist')(process.argv.slice(2));
const structPost = require('../struct/post');

module.exports = async (target) => {
    const tempDir = path.resolve(targetHelper(target), 'template');
    const tempThread = path.resolve(tempDir, 'thread.db');
    if (argv.debug) {
        printLog('debug', 'Remove template directory');
        fs.removeSync(tempDir);
    }
    printLog('debug', 'Creating template directory (if not exist)');
    fs.mkdirpSync(tempDir);
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
        sequelize.define('post', structPost);
        await sequelize.sync({ force: true });
    }
};
