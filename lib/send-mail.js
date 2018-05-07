const nodemailer = require('nodemailer');

const config = require('./config');

const sendMail = ({
    to, subject, text, html,
} = {}) => new Promise((resolve, reject) => {
    nodemailer.sendMail({
        from: config.senderMail,
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
