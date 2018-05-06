const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const argv = require('minimist')(process.argv.slice(2));
const targetHelper = require('./target-dir');
const printLog = require('./log');
const { version } = require('../package.json');

const webhook = (operation, content) => {
    const targetDir = targetHelper(argv._[1]);
    const configPath = path.resolve(targetDir, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }));
    if (config.webhook) {
        printLog('info', 'Sending webhook request');
        request({
            url: config.webhook,
            method: 'POST',
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `Pomment/${version} (Webhook Handler)`,
            },
            body: {
                operation,
                content,
            },
        }, (e, response, body) => {
            if (!e && response.statusCode === 200) {
                printLog('info', `Result: ${body}`);
            } else {
                printLog('error', `An error occurred while sending webhook request: ${e}`);
            }
        });
    }
};

module.exports = webhook;
