const config = require('./config');
const request = require('request');
const printLog = require('./log');
const { version } = require('../package.json');

const webhook = (operation, content) => {
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
