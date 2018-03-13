#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const printLog = require('./lib/log');
const setup = require('./lib/setup');
const server = require('./server');
const fs = require('fs');
const path = require('path');

const showHelp = () => {
    console.log(`Usage: pomment COMMAND [OPTION]...

Avaliable commands:

 - init [PATH]\t\tInit a Pomment data directory
 - web [PATH] [-p PORT]\tRun the web service. Default port is 3000`);
};

switch (argv._[0]) {
case 'init': {
    setup(argv._[1]);
    break;
}
case 'web': {
    const webPort = typeof argv.p !== 'undefined' ? Number(argv.p) : 3000;
    if (typeof process.getuid !== 'undefined' && process.getuid() === 0) {
        printLog('warn', 'Running Pomment as root is NOT recommended.');
    }
    server.listen(webPort);
    printLog('info', `The HTTP server is listening port ${webPort}`);
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
