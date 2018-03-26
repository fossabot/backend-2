const crypto = require('crypto');
const printLog = require('./log');

const getHash = (str) => {
    const shasum = crypto.createHash('sha256');
    shasum.update(str);
    return shasum.digest('hex');
};

module.exports = (config, hash) => {
    const expectedHash = getHash(config.admin.username + config.admin.password);
    printLog('debug', `Wanted hash: ${expectedHash}`);
    return expectedHash === hash;
};
