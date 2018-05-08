const getSha256 = require('./get-sha256');

module.exports = (...options) => {
    const list = options.join(' ');
    return getSha256(list);
};
