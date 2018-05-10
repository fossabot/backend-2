const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const printLog = require('./log');
const randChar = require('./randchar');
const initIndex = require('./init-index');
const targetHelper = require('./target-dir');
const inputFallback = require('./cli-input');
const getSalted = require('./get-salted');

module.exports = async (target) => {
    const targetDir = targetHelper(target);
    printLog('debug', `Variable target: ${target}`);
    printLog('debug', `Variable targetDir: ${targetDir}`);
    if (!fs.existsSync(targetDir)) {
        printLog('error', `${targetDir}: no such file or directory`);
        process.exit(1);
    }
    const initConfig = {
        name: path.parse(targetDir).name,
        admin: null,
        requiredInfo: {
            email: true,
            website: false,
        },
        email: null,
        senderEmail: null,
        webhook: null,
        moderation: false,
        gusetEditTimeout: 120,
        coolDownTimeout: 30,
        badUserInfo: {},
        frontendLoader: {
            script: 'path/to/your/pomment.min.js',
            element: '#pomment',
            server: 'http://127.0.0.1:3000',
        },
        salt: randChar(24),
    };
    if (fs.readdirSync(targetDir).length > 0) {
        printLog('debug', `The directory contains: ${fs.readdirSync(targetDir).join(', ')}`);
        printLog('error', 'Current working directory not empty, abort.');
        process.exit(1);
    }
    // 站点实例名称
    initConfig.name = inputFallback('Your site name', path.parse(targetDir).name);

    // 管理员账户
    const passRand = randChar(16);
    const username = inputFallback('Owner\'s name', 'admin');
    const email = inputFallback('Owner\'s email address', 'pomment@example.com');
    const passPlain = inputFallback('Owner\'s password', passRand);
    const shasum = crypto.createHash('sha256');
    shasum.update(passPlain === '' ? passRand : passPlain);
    initConfig.admin = {
        username,
        email,
        password: getSalted(initConfig.salt, shasum.digest('hex')),
    };
    initConfig.badUserInfo = {
        name: [username, 'gi'],
        email: [email, 'gi'],
    };
    const configStr = JSON.stringify(initConfig, null, 4);

    // 创建空的 index.db 和若干文件夹
    try {
        fs.writeFileSync(path.resolve(targetDir, 'config.json'), configStr, { encoding: 'utf8' });
        fs.copyFileSync(path.resolve(__dirname, '../assets/mail-template-admin.html'), path.resolve(targetDir, 'mail-template-admin.html'));
        await initIndex(path.resolve(targetDir, 'index.db'));
        fs.mkdirSync(path.resolve(targetDir, 'threads'));
        fs.mkdirpSync(path.resolve(targetDir, 'cache/recentIP'));
    } catch (e) {
        printLog('error', `An error occurred while setup the data directory: ${e}`);
    }

    // 任务完成，汇总！
    console.log('So, your config.json created, and look like this:\n');
    console.log(configStr);
    console.log('\nDon\'t forget to edit your config.json if you need customizing more values!');
};
