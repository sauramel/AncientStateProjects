/*
Example of a pet:
{
	name: 'Red Macaw\'s Cage',
	type: 'pet',
	quality: 2,
	noDrop: true,
	noSalvage: true,
	cdMax: 10,
	sprite: [11, 9],
	spritesheet: 'images/questItems.png',
	petCell: 42,
	petSheet: 'mobs',
	petName: 'Red Macaw',
	useText: 'summon',
	description: 'Vibrant, majestic and bitey.'
}
*/

module.exports = {
	name: 'Feature: Pets',

	init: function () {
		this.events.on('onBeforeUseItem', this.onBeforeUseItem.bind(this));
		this.events.on('onBeforeGetEffect', this.onBeforeGetEffect.bind(this));
	},

	onBeforeUseItem: function (obj, item, result) {
		if (item.type !== 'pet')
			return;

		let syncer = obj.syncer;

		let blueprint = {
			x: obj.x + 1,
			y: obj.y,
			cell: item.petCell,
			sheetName: item.petSheet,
			name: item.petName,
			properties: {
				cpnFollower: {
					maxDistance: 2
				},
				cpnMob: {
					walkDistance: 1
				},
				cpnSyncer: {},
				cpnStats: {}
			},
			extraProperties: {
				follower: {
					master: obj
				}
			}
		};

		//Spawn a mob
		let pet = obj.instance.spawners.spawn({
			amountLeft: 1,
			blueprint: blueprint
		});

		let builtEffect = obj.effects.addEffect({
			type: 'pet',
			new: true
		});
		builtEffect.source = item;
		builtEffect.pet = pet;

		item.useText = 'dismiss';
		syncer.setArray(true, 'inventory', 'getItems', item);
	},

	onBeforeGetEffect: function (result) {
		if (result.type.toLowerCase() === 'pet') 
			result.url = `${this.relativeFolderName}/effects/effectPet.js`;
	}
};
