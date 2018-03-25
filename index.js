#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const printLog = require('./lib/log');
const setup = require('./lib/setup');
const template = require('./lib/template');
const server = require('./server');
const resetPassword = require('./lib/reset-password');
const fs = require('fs');
const path = require('path');

printLog('debug', JSON.stringify(argv));

const showHelp = () => {
    console.log(`Usage: pomment COMMAND [OPTION]...

Avaliable commands:

 - init [PATH]              Init a Pomment data directory
 - web [PATH] [-p PORT]     Run the web service. Default port is 3000
 - reset-password [PATH]    Reset admin's password`);
};

switch (argv._[0]) {
case 'init': {
    setup(argv._[1]);
    template(argv._[1]);
    break;
}
case 'web': {
    template(argv._[1]);
    const webPort = typeof argv.p !== 'undefined' ? Number(argv.p) : 3000;
    if (typeof process.getuid !== 'undefined' && process.getuid() === 0) {
        printLog('warn', 'Running Pomment as root is NOT recommended.');
    }
    server(webPort);
    printLog('info', `The HTTP server is listening port ${webPort}`);
    break;
}
case 'reset-password': {
    resetPassword(argv._[1]);
    break;
}
case 'version': {
    const meta = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')));
    console.log(meta.version);
    break;
}
case 'help': {
    showHelp();
    break;
}
default: {
    printLog('error', 'At least one command is required');
    showHelp();
    process.exit(1);
    break;
}
}
