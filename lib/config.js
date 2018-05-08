const fs = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const printLog = require('./log');
const basePath = require('./base-path');

const target = path.resolve(basePath, 'config.json');

try {
    const config = fs.readJSONSync(target, { encoding: 'utf8' });
    module.exports = config;
} catch (e) {
    switch (argv._[0]) {
    case 'web':
    case 'reset-password': {
        printLog('error', `${target}: no such file or directory`);
        process.exit(1);
        break;
    }
    default: {
        throw e;
    }
    }
}
