const path = require('path');
const Sequelize = require('sequelize');
const targetHelper = require('./target-dir');
const structThread = require('../struct/thread');

/**
 * 更新一个主题的计数器
 * @param {string} target - index.db 所在的文件夹
 * @param {string} name - 主题名称
 * @param {number} num - 计数器数值
 * @param {boolean} first @default false - 是否为首次创建
 * @returns {number} 计数器数值
 */

module.exports = async (target, name, num, first = false) => {
    const indexPath = path.resolve(targetHelper(target), 'index.db');
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: indexPath,
        operatorsAliases: false,
    });
    const thread = sequelize.define('thread', structThread, {
        createdAt: false,
        updatedAt: false,
    });
    if (first) {
        await thread.create({
            name,
            post: num,
        });
    } else {
        thread.update({
            post: num,
        }, {
            where: { name },
        });
    }
    return num;
};
