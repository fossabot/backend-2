#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const printLog = require('./lib/log');
const setup = require('./lib/setup');
const server = require('./server');

switch (argv._[0]) {
case 'init': {
    setup(argv._[1]);
    break;
}
case 'web': {
    server.listen(3000);
    printLog('info', 'The HTTP server is listening port 3000');
    break;
}
default: {
    break;
}
}
