const fs = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const printLog = require('./log');
const basePath = require('./base-path');

const config = {
    common: null,
    email: null,
    guard: null,
};

switch (argv._[0]) {
case 'init':
case 'web':
case 'reset-password': {
    try {
        const keyList = Object.keys(config);
        for (let i = 0; i < keyList.length; i += 1) {
            const temp = fs.writeFileSync(path.resolve(basePath, `config/${keyList[i]}.json`));
            config[keyList[i]] = JSON.parse(temp);
        }
        module.exports = config;
    } catch (e) {
        printLog('debug', e);
        if (argv._[0] === 'init') {
            module.exports = null;
        }
        printLog('error', e);
        process.exit(1);
        break;
    }
    break;
}
default: {
    break;
}
}
