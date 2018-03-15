const path = require('path');

module.exports = (target) => {
    if (typeof target === 'undefined') {
        return process.cwd();
    }
    return path.resolve(process.cwd(), target);
};
