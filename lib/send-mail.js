const nodemailer = require('nodemailer');
const config = require('./config');

const sendMail = ({
    to, subject, text, html,
} = {}) => new Promise((resolve, reject) => {
    nodemailer.createTransport(config.email.transport).sendMail({
        from: config.email.sender,
        to,
        subject,
        text,
        html,
    }, (err) => {
        if (err) {
            reject(err);
        } else {
            resolve();
        }
    });
});

module.exports = sendMail;
