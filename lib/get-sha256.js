const crypto = require('crypto');

const getSha256 = (str) => {
    const shasum = crypto.createHash('sha256');
    shasum.update(str);
    return shasum;
};

module.exports = getSha256;
