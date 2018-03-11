const fs = require('fs-extra');
const path = require('path');
const beautify = require('json-beautify');
const scanf = require('scanf');
const crypto = require('crypto');
const printLog = require('./log');

const randChar = (amount) => {
    let temp = '';
    for (let i = 0; i < amount; i += 1) {
        temp += Math.random().toString(36).substring(2, 3);
    }
    return temp;
};

const inputFallback = (desc, def) => {
    process.stdout.write(typeof def === 'undefined' ? `${desc}: ` : `${desc} (${def}): `);
    const userInput = scanf('%S');
    if (userInput.trim() !== '') {
        return userInput.trim();
    }
    return def;
};

module.exports = (target) => {
    let targetDir;
    if (typeof target === 'undefined') {
        targetDir = process.cwd();
    } else {
        targetDir = path.resolve(process.cwd(), target);
    }
    const initConfig = {
        name: path.parse(targetDir).name,
    };
    if (fs.readdirSync(targetDir).length > 0) {
        printLog('error', 'Current working directory not empty, abort.');
        process.exit(1);
    }
    // 站点实例名称
    initConfig.name = inputFallback('Your site name', path.parse(targetDir).name);

    // 管理员账户
    const passRand = randChar(16);
    const username = inputFallback('Admin username', 'admin');
    const passPlain = inputFallback('Admin password', passRand);
    const shasum = crypto.createHash('sha1');
    shasum.update(passPlain === '' ? passRand : passPlain);
    initConfig.admin = {
        username,
        password: shasum.digest('hex'),
    };
    const configStr = beautify(initConfig, null, 4);
    fs.writeFileSync(path.resolve(targetDir, 'config.json'), configStr, { encoding: 'utf8' });
    console.log('So, your config.json created, and look like this:\n');
    console.log(configStr);
    console.log('\nDon\'t forget to edit your config.json if you need customizing more values!');
};
