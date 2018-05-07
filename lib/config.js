const fs = require('fs-extra');
const path = require('path');

const basePath = require('./base-path');

const config = fs.readJSONSync(path.resolve(basePath, 'config.json'), { encoding: 'utf8' });

module.exports = config;
