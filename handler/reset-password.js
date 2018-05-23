const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const printLog = require('../lib/log');
const randChar = require('../lib/randchar');
const targetHelper = require('../lib/target-dir');
const inputFallback = require('../lib/cli-input');

module.exports = async (target) => {
    const targetDir = targetHelper(target);
    printLog('debug', `Variable target: ${target}`);
    printLog('debug', `Variable targetDir: ${targetDir}`);
    const config = fs.readJSONSync(path.resolve(targetDir, 'config.json'), { encoding: 'utf8' });
    const passRand = randChar(16);
    const passPlain = inputFallback('New admin password', passRand);
    const shasum = crypto.createHash('sha256');
    config.admin.password = shasum.update(passPlain === '' ? passRand : passPlain);
    printLog('info', 'Admin password updated');
    fs.writeFileSync(path.resolve(targetDir, 'config.json'), JSON.stringify(config, null, 4), { encoding: 'utf8' });
};
