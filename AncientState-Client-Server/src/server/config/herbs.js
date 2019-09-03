let events = require('../misc/events');

module.exports = {
	init: function () {
		events.emit('onBeforeGetHerbConfig', this);
	},

	Moonbell: {
		sheetName: 'tiles',
		cell: 50,
		itemSprite: [1, 1]
	},
	Skyblossom: {
		sheetName: 'tiles',
		cell: 52,
		itemSprite: [1, 2]
	},
	Emberleaf: {
		sheetName: 'tiles',
		cell: 51,
		itemSprite: [1, 0]
	},
	'Sun Carp': {
		sheetName: 'objects',
		itemSprite: [11, 2],
		baseWeight: 3,
		ttl: 30
	}
};
