const crypto = require('crypto');

const getEditKey = () => crypto.randomBytes(16).toString('hex');

module.exports = getEditKey;
