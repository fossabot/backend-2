const config = require('../lib/config');
const getSalted = require('../lib/get-salted');

module.exports = (hash) => {
    const expectedHash = config.common.admin.password;
    return expectedHash === getSalted(config.common.salt, hash).digest('hex');
};
