let events = require('../misc/events');

module.exports = {
	resourceList: [],

	init: function () {
		events.emit('onBeforeGetResourceList', this.resourceList);
	},

	getResourcesList: function (msg) {
		msg.callback(this.resourceList);
	}
};
