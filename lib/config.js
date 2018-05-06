const fs = require('fs-extra');
const path = require('path');
const printLog = require('./log');
const basePath = require('./base-path');

module.exports = () => {
    const targetDir = basePath();
    printLog('debug', `Variable targetDir: ${targetDir}`);
    return fs.readJSONSync(path.resolve(targetDir, 'config.json'), { encoding: 'utf8' });
};
