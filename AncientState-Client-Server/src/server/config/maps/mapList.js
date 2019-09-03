let events = require('../../misc/events');

let config = [
	{
		name: 'cave',
		path: 'config/maps'
	},
	{
		name: 'estuary',
		path: 'config/maps'
	},
	{
		name: 'sewer',
		path: 'config/maps'
	},
	{
		name: 'fjolarok',
		path: 'config/maps'
	},
	{
		name: 'dungeon',
		path: 'config/maps'
	}
];

module.exports = {
	init: function () {
		events.emit('onBeforeGetMapList', config);
		this.mapList = config;
	}
};
