const fs = require('fs-extra');
const path = require('path');
const scanf = require('scanf');
const crypto = require('crypto');
const printLog = require('./log');
const randChar = require('./randchar');
const initIndex = require('./init-index');
const targetHelper = require('./target-dir');

const inputFallback = (desc, def) => {
    process.stdout.write(typeof def === 'undefined' ? `${desc}: ` : `${desc} (${def}): `);
    const userInput = scanf('%S');
    if (userInput.trim() !== '') {
        return userInput.trim();
    }
    return def;
};

module.exports = async (target) => {
    const targetDir = targetHelper(target);
    printLog('debug', `Variable target: ${target}`);
    printLog('debug', `Variable targetDir: ${targetDir}`);
    const initConfig = {
        name: path.parse(targetDir).name,
        admin: null,
        requiredInfo: {
            email: true,
            website: false,
        },
        mail: false,
        webhook: false,
        moderation: false,
        gusetEditTimeout: 120,
        coolDownTimeout: 7777600,
        badUserInfo: {},
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
    const username = inputFallback('Admin username', 'admin');
    const email = inputFallback('Admin email address', 'pomment@example.com');
    const passPlain = inputFallback('Admin password', passRand);
    const shasum = crypto.createHash('sha256');
    shasum.update(passPlain === '' ? passRand : passPlain);
    initConfig.admin = {
        username,
        email,
        password: shasum.digest('hex'),
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
        await fs.mkdir(path.resolve(targetDir, 'threads'));
        await fs.mkdir(path.resolve(targetDir, 'cache'));
    } catch (e) {
        printLog('error', `An error occurred while setup the data directory: ${e}`);
    }

    // 任务完成，汇总！
    console.log('So, your config.json created, and look like this:\n');
    console.log(configStr);
    console.log('\nDon\'t forget to edit your config.json if you need customizing more values!');
};
