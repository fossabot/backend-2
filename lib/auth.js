const crypto = require('crypto');

const getHash = (str) => {
    const shasum = crypto.createHash('sha256');
    shasum.update(str);
    return shasum.digest('hex');
};

module.exports = (config, hash) => {
    const expectedHash = getHash(config.admin.username + config.admin.password);
    return expectedHash === hash;
};
