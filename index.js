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

 - init [PATH]\tInit a Pomment data directory
 - web\t\tRun the web service`);
};

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
    showHelp();
    process.exit(1);
    break;
}
}
