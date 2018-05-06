const argv = require('minimist')(process.argv.slice(2));
const targetHelper = require('./target-dir');

module.exports = () => targetHelper(argv._[1]);
