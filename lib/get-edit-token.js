const crypto = require('crypto');

module.exports = (...options) => {
    const list = options.join(' ');
    const shasum = crypto.createHash('sha256');
    shasum.update(list);
    // console.log(list);
    return shasum.digest('hex');
};
