let serverConfig = require('../config/serverConfig');

const moduleMap = {
	sqlite: 'Sqlite',
	rethink: 'RethinkDb'
};
const modulePath = `./mail${moduleMap[serverConfig.db]}`;

module.exports = require(modulePath);
