const argv = require('minimist')(process.argv.slice(2));

/**
 * 向终端发送一行日志内容
 * @param {string} level - 日志级别，可以是 info、warn、error、debug，其中 debug 在没有 --debug 标签启动时不会输出
 * @param {string} text - 日志文本
 * @returns {boolean} 是否发送成功
 */
module.exports = (level, text) => {
    switch (level) {
    case 'info':
        console.log(`\x1b[1m\x1b[36m[INFO]\x1b[0m ${text}\x1b[0m`);
        break;
    case 'warn':
        console.warn(`\x1b[1m\x1b[31m[WARN]\x1b[0m ${text}\x1b[0m`);
        break;
    case 'error':
        console.error(`\x1b[1m\x1b[35m[ERROR]\x1b[0m ${text}\x1b[0m`);
        break;
    case 'debug':
        if (argv.debug) {
            console.debug(`\x1b[1m\x1b[32m[DEBUG]\x1b[0m ${text}\x1b[0m`);
        }
        break;
    default:
        return false;
    }
    return true;
};
