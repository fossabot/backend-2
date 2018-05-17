const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const printLog = require('../lib/log');
const randChar = require('../lib/randchar');
const initIndex = require('./init-index');
const targetHelper = require('../lib/target-dir');
const inputFallback = require('../lib/cli-input');
const getSalted = require('../lib/get-salted');

module.exports = async (target) => {
    const targetDir = targetHelper(target);
    printLog('debug', `Variable target: ${target}`);
    printLog('debug', `Variable targetDir: ${targetDir}`);
    if (!fs.existsSync(targetDir)) {
        printLog('error', `${targetDir}: no such file or directory`);
        process.exit(1);
    }
    const initConfig = {
        common: {
            name: path.parse(targetDir).name,
            webHost: '127.0.0.1',
            webPost: 4600,
            admin: null,
            salt: randChar(24),
            requireEmail: true,
            requireWebsite: false,
            moderation: false,
            webhook: null,
            frontendLoader: {
                script: 'path/to/your/pomment.min.js',
                element: '#pomment',
                server: 'http://127.0.0.1:3000',
                fixedHeight: 0,
            },
        },
        email: {
            enabled: false,
            transport: {
                host: 'smtp.example.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'your username',
                    pass: 'your password',
                },
            },
            sender: null,
            replyTitle: '[{{siteTitle}}] {{masterName}}, Your post got a reply!',
        },
        guard: {
            allowedOrigin: [],
            gusetEditTimeout: 120,
            coolDownTimeout: 30,
            badUserInfo: {},
        },
    };
    if (fs.readdirSync(targetDir).length > 0) {
        printLog('debug', `The directory contains: ${fs.readdirSync(targetDir).join(', ')}`);
        printLog('error', 'Current working directory not empty, abort.');
        process.exit(1);
    }
    // 站点实例名称
    initConfig.common.name = inputFallback('Your site name', path.parse(targetDir).name);

    // 管理员账户
    const passRand = randChar(16);
    const username = inputFallback('Owner\'s name', 'admin');
    const email = inputFallback('Owner\'s email address', 'pomment@example.com');
    const passPlain = inputFallback('Owner\'s password', passRand);
    const shasum = crypto.createHash('sha256');
    shasum.update(passPlain === '' ? passRand : passPlain);

    // 更新模板配置
    initConfig.common.admin = {
        username,
        email,
        password: getSalted(initConfig.common.salt, shasum.digest('hex')).digest('hex'),
    };
    initConfig.email.sender = email;
    initConfig.guard.badUserInfo = {
        name: [username, 'gi'],
        email: [email, 'gi'],
    };

    // 创建空的 index.db 和若干文件夹
    try {
        await initIndex(path.resolve(targetDir, 'index.db'));
        fs.mkdirSync(path.resolve(targetDir, 'config'));
        const keyList = Object.keys(initConfig);
        for (let i = 0; i < keyList.length; i += 1) {
            fs.writeFileSync(
                path.resolve(targetDir, `config/${keyList[i]}.json`),
                JSON.stringify(initConfig[keyList[i]], null, 4),
            );
        }
        fs.mkdirSync(path.resolve(targetDir, 'threads'));
        fs.mkdirpSync(path.resolve(targetDir, 'cache/recentIP'));
    } catch (e) {
        printLog('error', `An error occurred while setup the data directory: ${e}`);
    }

    // 任务完成，汇总！
    console.log('Your Pomment data directory has been created!');
    console.log('Don\'t forget to edit your config files if you need customizing more values!');
};
