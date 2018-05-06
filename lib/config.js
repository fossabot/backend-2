const fs = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const printLog = require('./log');
const targetHelper = require('./target-dir');

module.exports = () => {
    const targetDir = targetHelper(argv._[1]);
    printLog('debug', `Variable targetDir: ${targetDir}`);
    return fs.readJSONSync(path.resolve(targetDir, 'config.json'), { encoding: 'utf8' });
};
