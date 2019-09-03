const serverConfig = require('../config/serverConfig');
const connections = require('../security/connections');
const version = serverConfig.version;
const bcrypt = require('bcrypt-nodejs');
const roles = require('../config/roles');

module.exports = {
	init: function (app) {
		app.get('/info', (req, res, next) => res.jsonp({
			v: version,
			p: cons.playing
		}));

		app.get('/adminForceSave', this.forceSaveAll.bind(this));
	},

	forceSaveAll: async function (req, res, next) {
		let config = {};

		let pars = req.originalUrl.split('?').pop().split('&');
		pars.forEach(p => {
			let [par, val] = p.split('=');
			config[par] = val
				.split('%20')
				.join(' ');
		});

		if (['msg', 'username', 'pwd'].some(p => !config[p]))
			return;

		let storedPassword = await io.getAsync({
			key: config.username,
			table: 'login',
			noParse: true
		});

		bcrypt.compare(config.pwd, storedPassword, this.doSaveAll.bind(this, res, config));
	},

	doSaveAll: function (res, config, err, compareResult) {
		if (!compareResult)
			return;

		let roleLevel = roles.getRoleLevel({
			account: config.username
		});
		if (roleLevel < 9)
			return;

		cons.emit('event', {
			event: 'onGetMessages',
			data: {
				messages: [{
					class: 'color-blueA',
					message: config.msg,
					type: 'chat'
				}]
			}
		});

		connections.forceSaveAll();

		res.jsonp({
			success: true
		});
	},

	willHandle: function (url) {
		if (url.includes('/info') || url.includes('/adminForceSave'))
			return true;
	}
};
