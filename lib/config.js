const fs = require('fs-extra');
const path = require('path');

const basePath = require('./base-path');

const targetDir = basePath();
const config = fs.readJSONSync(path.resolve(targetDir, 'config.json'), { encoding: 'utf8' });

module.exports = config;
