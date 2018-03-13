const fs = require('fs');
const path = require('path');
const printLog = require('./log');

module.exports = (target) => {
    let targetDir;
    if (typeof target === 'undefined') {
        targetDir = process.cwd();
    } else {
        targetDir = path.resolve(process.cwd(), target);
    }
    printLog('debug', `Variable targetDir: ${targetDir}`);
    return JSON.parse(fs.readFileSync(path.resolve(targetDir, 'config.json'), { encoding: 'utf8' }));
};
