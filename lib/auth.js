const printLog = require('./log');
const config = require('../lib/config');
const getSalted = require('../lib/get-salted');

module.exports = (hash) => {
    const expectedHash = config.admin.password;
    printLog('debug', `Wanted hash: ${expectedHash}`);
    return expectedHash === getSalted(config.salt, hash).digest('hex');
};
