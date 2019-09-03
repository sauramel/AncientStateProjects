let events = require('../misc/events');

let list = {};

module.exports = {
	init: function () {
		events.emit('onBeforeGetMtxList', list);
	},

	get: function (name) {
		return list[name];
	}
};
