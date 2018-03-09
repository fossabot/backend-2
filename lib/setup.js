const fs = require('fs-extra');
const path = require('path');
const beautify = require('json-beautify');
const scanf = require('scanf');
const printLog = require('./log');

const inputFallback = (desc, def) => {
    process.stdout.write(typeof def === 'undefined' ? `${desc}: ` : `${desc} (${def}): `);
    const userInput = scanf('%S');
    if (userInput.trim() !== '') {
        return userInput.trim();
    }
    return def;
};

module.exports = (target) => {
    let targetDir;
    if (typeof target === 'undefined') {
        targetDir = process.cwd();
    } else {
        targetDir = path.resolve(process.cwd(), target);
    }
    const initConfig = {
        name: path.parse(targetDir).name,
        database: {},
        admin: {},
    };
    if (fs.readdirSync(targetDir).length > 0) {
        printLog('error', 'Current working directory not empty, abort.');
        process.exit(1);
    }
    // 站点实例名称
    initConfig.name = inputFallback('Your site name', path.parse(targetDir).name);

    // 实例数据类型
    console.log('In Pomment, you may use these following types of database: mysql | sqlite');
    const dbArch = inputFallback('The database type you want to use', 'sqlite');

    switch (dbArch) {
    case 'mysql': {
        const host = inputFallback('Database host', 'localhost');
        const port = Number(inputFallback('Database port', '3306'));
        const name = inputFallback('Database name', 'pomment');
        const username = inputFallback('Database user name', 'root');
        const password = inputFallback('Database password', '');
        initConfig.database = {
            arch: 'mysql',
            host,
            port,
            name,
            username,
            password,
        };
        break;
    }
    case 'sqlite': {
        initConfig.database = {
            arch: 'sqlite',
            dataFile: 'data.db',
        };
        break;
    }
    default: {
        console.error(`The database type ${dbArch} you defined is not supported yet.`);
        process.exit(1);
        break;
    }
    }
    console.log('So, your config.json created, and look like this:\n');
    console.log(beautify(initConfig, null, 4, 80));
    console.log('\nDon\'t forget to edit your config.json if you need customizing more values!');
};
