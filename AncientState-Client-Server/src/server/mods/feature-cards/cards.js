let itemGenerator = require('../../items/generator');

let config = {
	'Runecrafter\'s Toil': {
		chance: 0.025,
		reward: 'Level 10 Rune',
		setSize: 3,
		mobLevel: [3, 100]
	},
	'Godly Promise': {
		chance: 0.01,
		reward: 'Level 15 Legendary Weapon',
		setSize: 6,
		zone: 'sewer'
	},
	'The Other Heirloom': {
		chance: 0.02,
		reward: 'Perfect Level 10 Ring',
		setSize: 3,
		mobName: 'flamingo'
	},
	'Benthic Incantation': {
		chance: 0.015,
		reward: 'Princess Morgawsa\'s Trident',
		setSize: 12,
		zone: 'estuary'
	},
	'Fangs of Fury': {
		chance: 0.2,
		reward: 'Steelclaw\'s Bite',
		setSize: 20,
		mobName: 'steelclaw'
	},
	'Tradesman\'s Pride': {
		chance: 0.007,
		reward: 'Five Random Idols',
		setSize: 10
	}
};

module.exports = {
	init: function () {

	},

	fixCard: function (card) {
		let template = config[card.name];
		if (!template)
			return;

		card.setSize = template.setSize;
	},

	getCard: function (looter, mob) {
		let pool = [];

		let mobLevel = mob.stats.values.level;

		let configs = extend({}, config);
		looter.instance.eventEmitter.emit('onBeforeGetCardsConfig', configs);

		Object.keys(configs).forEach(function (c) {
			let card = configs[c];
			if (!card.chance)
				return;

			let rqrLevel = card.mobLevel;
			if (rqrLevel) {
				if ((rqrLevel.push) && ((mobLevel < rqrLevel[0]) || (mobLevel > rqrLevel[1])))
					return;
				else if ((!rqrLevel.push) && (mobLevel !== rqrLevel))
					return;
			}
			let mobName = card.mobName;
			if (mobName) {
				if ((mobName.toLowerCase) && (mob.name.toLowerCase() !== mobName.toLowerCase()))
					return;
				else if ((mobName.push) && (!mobName.some(m => (m.toLowerCase() === mob.name.toLowerCase()))))
					return;
			}

			if ((card.zone) && (looter.zoneName !== card.zone))
				return;

			if (Math.random() >= card.chance)
				return;

			pool.push(c);
		}, this);

		if (pool.length === 0)
			return;

		let pickName = pool[~~(Math.random() * pool.length)];
		let pick = configs[pickName];

		let builtCard = {
			name: pickName,
			spritesheet: pick.spritesheet || `${this.folderName}/images/items.png`,
			type: 'Reward Card',
			description: 'Reward: ' + pick.reward,
			noSalvage: true,
			sprite: pick.sprite || [0, 0],
			quantity: 1,
			quality: pick.quality || 1,
			setSize: pick.setSize
		};

		return builtCard;
	},

	getReward: function (looter, set) {
		let configs = extend({}, config);
		looter.instance.eventEmitter.emit('onBeforeGetCardsConfig', configs);

		let reward = configs[set].reward;
		let msg = {
			reward: reward,
			handler: this.rewards[reward]
		};

		looter.instance.eventEmitter.emit('onBeforeGetCardReward', msg);

		return msg.handler(looter);
	},

	rewards: {
		'Level 10 Rune': function () {
			return itemGenerator.generate({
				level: 10,
				spell: true
			});
		},

		'Level 15 Legendary Weapon': function () {
			let slot = ['oneHanded', 'twoHanded'][~~(Math.random() * 2)];

			return itemGenerator.generate({
				level: 15,
				quality: 4,
				noSpell: true,
				slot: slot
			});
		},

		'Perfect Level 10 Ring': function () {
			return itemGenerator.generate({
				level: 10,
				noSpell: true,
				quality: 1,
				perfection: 1,
				slot: 'finger'
			});
		},

		"Princess Morgawsa's Trident": function () {
			return itemGenerator.generate({
				name: 'Princess Morgawsa\'s Trident',
				level: [18, 20],
				attrRequire: 'int',
				quality: 4,
				noSpell: true,
				slot: 'twoHanded',
				sprite: [0, 0],
				spritesheet: '../../../images/legendaryItems.png',
				type: 'Trident',
				description: 'Summoned from the ancient depths of the ocean by the Benthic Incantation.',
				stats: ['elementFrostPercent', 'elementFrostPercent', 'elementFrostPercent'],
				effects: [{
					type: 'freezeOnHit',
					rolls: {
						i_chance: [2, 5],
						i_duration: [2, 4]
					}
				}],
				spellName: 'projectile',
				spellConfig: {
					statType: 'int',
					statMult: 1,
					element: 'arcane',
					auto: true,
					cdMax: 7,
					castTimeMax: 0,
					manaCost: 0,
					range: 9,
					random: {
						damage: [1.65, 10.81]
					}
				}
			});
		},

		'Five Random Idols': function () {
			let result = [];
			for (let i = 0; i < 5; i++) {
				result.push(itemGenerator.generate({
					currency: true
				}));
			}
			return result;
		},

		"Steelclaw's Bite": function () {
			return itemGenerator.generate({
				name: 'Steelclaw\'s Bite',
				level: [18, 20],
				attrRequire: 'dex',
				quality: 4,
				noSpell: true,
				slot: 'oneHanded',
				sprite: [1, 0],
				spritesheet: '../../../images/legendaryItems.png',
				type: 'Curved Dagger',
				description: 'The blade seems to be made of some kind of bone and steel alloy.',
				stats: ['dex', 'dex', 'addCritMultiplier', 'addCritMultiplier'],
				effects: [{
					type: 'damageSelf',
					properties: {
						element: 'poison'
					},
					rolls: {
						i_percentage: [8, 22]
					}
				}, {
					type: 'alwaysCrit',
					rolls: {}
				}],
				spellName: 'melee',
				spellConfig: {
					statType: 'dex',
					statMult: 1,
					cdMax: 3,
					castTimeMax: 0,
					useWeaponRange: true,
					random: {
						damage: [0.88, 5.79]
					}
				}
			});
		}
	}
};
