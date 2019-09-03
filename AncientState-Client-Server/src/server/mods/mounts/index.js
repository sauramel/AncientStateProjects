/*
Example of a mount:
{
	name: 'Brown Horse\'s Reins',
	type: 'mount',
	quality: 2,
	noDrop: true,
	noSalvage: true,
	cdMax: 10,
	sprite: [0, 9],
	spritesheet: 'images/questItems.png',
	useText: 'mount',
	description: 'Stout, dependable and at least faster than you',
	effects: [{
		type: 'mounted',
		rolls: {
			speed: 150,
			cell: 0,
			sheetName: 'mobs'
		}
	}]
}
*/

module.exports = {
	name: 'Feature: Mounts',

	init: function () {
		this.events.on('onBeforeUseItem', this.onBeforeUseItem.bind(this));
		this.events.on('onBeforeGetEffect', this.onBeforeGetEffect.bind(this));
	},

	onBeforeUseItem: function (obj, item, result) {
		if (item.type !== 'mount')
			return;

		let syncer = obj.syncer;

		let currentEffect = obj.effects.removeEffectByName('mounted', true);
		if (currentEffect) {
			let currentItem = currentEffect.source;
			currentItem.useText = 'mount';
			currentItem.cdMax = 0;

			syncer.setArray(true, 'inventory', 'getItems', currentItem);

			if (currentItem === item)
				return;
		}

		let effectOptions = extend({ type: 'mounted',
			ttl: -1
		}, item.effects[0].rolls);

		let builtEffect = obj.effects.addEffect(effectOptions);
		builtEffect.source = item;

		item.useText = 'unmount';
		syncer.setArray(true, 'inventory', 'getItems', item);
	},

	onBeforeGetEffect: function (result) {
		if (result.type.toLowerCase() === 'mounted') 
			result.url = `${this.relativeFolderName}/effects/effectMounted.js`;
	}
};
