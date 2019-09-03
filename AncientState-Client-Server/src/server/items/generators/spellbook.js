let spells = require('../../config/spells');
let spellsConfig = require('../../config/spellsConfig');
let configTypes = require('../config/types');

module.exports = {
	generate: function (item, blueprint) {
		blueprint = blueprint || {};
		let spellQuality = blueprint ? blueprint.spellQuality : '';
		let spellName = blueprint.spellName;

		if (!spellName) {
			let spellList = Object.keys(spellsConfig.spells).filter(s => ((!spellsConfig.spells[s].auto) && (!s.noDrop)));
			spellName = spellList[~~(Math.random() * spellList.length)];
		}

		let spell = extend({}, spellsConfig.spells[spellName], blueprint.spellConfig);
		let spellAesthetic = spells.spells.find(s => s.name.toLowerCase() === spellName) || {};

		if (!item.slot) {
			let sprite = [10, 0];
			let statType = spell.statType;
			if (statType === 'dex')
				sprite = [10, 1];
			else if (statType === 'str')
				sprite = [10, 2];
			else if (statType instanceof Array) {
				if ((statType.indexOf('dex') > -1) && (statType.indexOf('int') > -1))
					sprite = [10, 3];
				else if ((statType.indexOf('str') > -1) && (statType.indexOf('int') > -1))
					sprite = [10, 4];
			}

			item.name = 'Rune of ' + spellAesthetic.name;
			item.ability = true;
			item.sprite = sprite;
		} else if (spellQuality === 'basic')
			item.stats = {};

		if (blueprint.spellConfig)
			spellAesthetic = extend({}, spellAesthetic, blueprint.spellConfig);

		item.spell = {
			name: spellAesthetic.name || 'Weapon Damage',
			type: spellAesthetic.type || spellName,
			rolls: {},
			values: {}
		};

		if (blueprint.spellConfig) 
			extend(item.spell, blueprint.spellConfig);

		if (item.type) {
			let typeConfig = configTypes.types[item.slot][item.type];
			if (typeConfig)
				extend(spell, typeConfig.spellConfig);
		}

		let propertyPerfection = [];

		let randomProperties = spell.random || {};
		let negativeStats = spell.negativeStats || [];
		for (let r in randomProperties) {
			let negativeStat = (negativeStats.indexOf(r) > -1);
			let range = randomProperties[r];

			let max = Math.min(consts.maxLevel, item.level) / consts.maxLevel;

			let roll = random.expNorm(0, max);
			if (spellQuality === 'basic')
				roll = 0;
			else if (spellQuality === 'mid')
				roll = 0.5;

			item.spell.rolls[r] = roll;

			let int = r.indexOf('i_') === 0;
			let val = range[0] + ((range[1] - range[0]) * roll);

			if (int) {
				val = ~~val;
				r = r.replace('i_', '');
			} else
				val = ~~(val * 100) / 100;

			item.spell.values[r] = val;

			if (negativeStat)
				propertyPerfection.push(1 - roll);
			else
				propertyPerfection.push(roll);
		}

		if (blueprint.spellProperties) {
			item.spell.properties = {};
			for (let p in blueprint.spellProperties) 
				item.spell.properties[p] = blueprint.spellProperties[p];
		}

		if (item.range) {
			item.spell.properties = item.spell.properties || {};
			item.spell.properties.range = item.range;
		}

		let per = propertyPerfection.reduce((p, n) => p + n, 0);
		let perfection = ~~((per / propertyPerfection.length) * 4);
		if (!item.slot)
			item.quality = perfection;
		else
			item.spell.quality = perfection;
	}
};
