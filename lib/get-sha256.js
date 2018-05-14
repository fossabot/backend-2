const crypto = require('crypto');

const getSha256 = (str, raw = false) => {
    const shasum = crypto.createHash('sha256');
    shasum.update(str);
    if (raw) {
        return shasum;
    }
    return shasum.digest('hex');
};

module.exports = getSha256;
