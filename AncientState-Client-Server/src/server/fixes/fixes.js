let configSkins = require('../config/skins');

module.exports = {
	fixDb: async function () {
		await io.deleteAsync({
			key: 'list',
			table: 'leaderboard'
		});
	},

	fixCharacter: function (player) {
		let inv = player.components.find(c => (c.type === 'inventory'));
		if ((inv) && (inv.items))
			this.fixItems(inv.items);
	},

	fixCustomChannels: function (customChannels) {
		return customChannels
			.filter(c => {
				return (
					c.length <= 15 &&
					c.match(/^[0-9a-zA-Z]+$/)
				);
			});
	},

	fixStash: function (stash) {
		this.fixItems(stash);
	},

	fixItems: function (items) {
		items
			.filter(i => ((i.name === 'Cowl of Obscurity') && (!i.factions)))
			.forEach(function (i) {
				i.factions = [{
					id: 'gaekatla',
					tier: 7
				}];
			});

		items
			.filter(i => i.mtx)
			.forEach(i => {
				delete i.noDestroy;
			});

		items
			.filter(i => i.stats && i.stats.magicFind > 135)
			.forEach(i => {
				let value = '' + i.stats.magicFind;
				i.stats.magicFind = ~~(value.substr(value.length - 2));
			});

		items
			.filter(i => (
				i.enchantedStats && 
				i.slot !== 'tool' && 
				Object.keys(i.enchantedStats).some(e => e.indexOf('catch') === 0 || e.indexOf('fish') === 0)
			))
			.forEach(function (i) {
				let enchanted = i.enchantedStats;
				let stats = i.stats;
				Object.keys(enchanted).forEach(e => {
					if (e.indexOf('catch') === 0 || e.indexOf('fish') === 0) {
						delete stats[e];
						delete enchanted[e];
					}
				});

				if (!Object.keys(enchanted).length)
					delete i.enchantedStats;
			});

		items
			.filter(i => i.factions && i.factions.indexOf && i.factions.some(f => f.id === 'pumpkinSailor') && i.slot === 'finger')
			.forEach(i => {
				i.noDestroy = false;
			});

		items
			.filter(i => (i.name === 'Steelclaw\'s Bite'))
			.forEach(function (i) {
				let effect = i.effects[0];

				if (!effect.properties) {
					effect.properties = {
						element: 'poison'
					};
				} else if (!effect.properties.element)
					effect.properties.element = 'poison';
			});

		items
			.filter(f => ((f.effects) && (f.effects[0].factionId === 'akarei') && (!f.effects[0].properties)))
			.forEach(function (i) {
				let effect = i.effects[0];
				let chance = parseFloat(effect.text.split(' ')[0].replace('%', ''));

				effect.properties = {
					chance: chance
				};
			});

		items
			.filter(f => ((f.stats) && (f.stats.dmgPercent)))
			.forEach(function (i) {
				i.stats.physicalPercent = i.stats.dmgPercent;
				delete i.stats.dmgPercent;

				if ((i.enchantedStats) && (i.enchantedStats.dmgPercent)) {
					i.enchantedStats.physicalPercent = i.enchantedStats.dmgPercent;
					delete i.enchantedStats.dmgPercent;
				}
			});
	},

	fixSkins: async function (username, skins) {
		let length = skins.length;
		skins = skins.filter(s => !!configSkins.getBlueprint(s));

		if (length !== skins.length) {
			await io.setAsync({
				key: username,
				table: 'skins',
				value: skins,
				serialize: true
			});
		}
	}
};
