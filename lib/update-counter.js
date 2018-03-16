const path = require('path');
const Sequelize = require('sequelize');
const targetHelper = require('./target-dir');
const structThread = require('../struct/thread');

module.exports = async (target, name, num, first = false) => {
    const indexPath = path.resolve(targetHelper(target), 'index.db');
    const sequelize = new Sequelize('main', null, null, {
        dialect: 'sqlite',
        storage: indexPath,
        operatorsAliases: false,
    });
    const thread = sequelize.define('thread', structThread);
    if (first) {
        await thread.create({
            name,
            post: num,
        });
    } else {
        thread.findAll({
            where: {
                name,
            },
        }).then((result) => {
            //console.log('query all users');
            //console.log(result);
        });
    }
};
