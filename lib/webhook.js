const config = require('./config');
const request = require('request');
const printLog = require('./log');
const { version } = require('../package.json');

const webhook = (operation, thread, content) => new Promise((resolve, reject) => {
    if (config.common.webhook) {
        printLog('info', 'Sending webhook request');
        request({
            url: config.common.webhook,
            method: 'POST',
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `Pomment/${version} (Webhook Handler)`,
            },
            body: {
                operation,
                thread,
                content,
            },
        }, (e, response, body) => {
            if (!e && response.statusCode === 200) {
                printLog('info', `Result: ${body}`);
                resolve(body);
            } else if (!e) {
                reject(new ReferenceError(`Server returned ${response.statusCode}`));
            } else {
                reject(e);
            }
        });
    }
});

module.exports = webhook;
