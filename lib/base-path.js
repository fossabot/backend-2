const argv = require('minimist')(process.argv.slice(2));
const targetHelper = require('./target-dir');

const base = targetHelper(argv._[1]);

module.exports = base;
