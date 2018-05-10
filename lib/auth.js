const printLog = require('./log');
const config = require('../lib/config');
const getSalted = require('../lib/get-salted');

module.exports = (hash) => {
    const expectedHash = config.common.admin.password;
    printLog('debug', `Wanted hash: ${expectedHash}`);
    return expectedHash === getSalted(config.common.salt, hash).digest('hex');
};
