const printLog = require('./log');
const config = require('../lib/config');
const getSha256 = require('./get-sha256');

module.exports = (hash) => {
    const expectedHash = getSha256(config.admin.username + config.admin.password).digest('hex');
    printLog('debug', `Wanted hash: ${expectedHash}`);
    return expectedHash === hash;
};
