define([

], function (

) {
	return {
		standAlone: false,

		lineWidth: 5,
		blockSize: 20,
		defaultDistance: 50,
		defaultDistanceInc: 60,
		defaultAngle: Math.PI / 2,
		defaultAngleInc: Math.PI / 8,
		gridSize: 30,

		scrollSpeed: 0.75,

		stats: {
			str: 'strength',
			int: 'intellect',
			dex: 'dexterity',
			vit: 'vitality',
			regenHp: 'health regeneration',
			manaMax: 'maximum mana',
			regenMana: 'mana regeneration',
			armor: 'armor',
			attackSpeed: 'attack speed',
			castSpeed: 'cast speed',
			blockAttackChance: 'chance to block attacks',
			blockSpellChance: 'chance to block spells',
			addCritChance: 'increased crit chance',
			addCritMultiplier: 'increased crit multiplier',
			magicFind: 'increased item quality',
			itemQuantity: 'increased item quantity',
			sprintChance: 'sprint chance',
			allAttributes: 'to all attributes',
			xpIncrease: 'additional xp per kill',
			lvlRequire: 'level requirement reduction',
			elementArcanePercent: 'increased arcane damage',
			elementFrostPercent: 'increased frost damage',
			elementFirePercent: 'increased fire damage',
			elementHolyPercent: 'increased holy damage',
			elementPoisonPercent: 'increased poison damage',
			elementAllResist: 'all resistance',
			elementArcaneResist: 'arcane resistance',
			elementFrostResist: 'frost resistance',
			elementFireResist: 'fire resistance',
			elementHolyResist: 'holy resistance',
			elementPoisonResist: 'poison resistance',
			elementAllResist: 'all resistance',

			physicalPercent: 'increased physical damage',
			spellPercent: 'increased spell damage',
			elementPercent: 'increased elemental damage',
			addSpellCritChance: 'increased spell crit chance',
			addSpellCritMultiplier: 'increased spell crit multiplier',
			addAttackCritChance: 'increased attack crit chance',
			addAttackCritMultiplier: 'increased attack crit multiplier',
			dodgeAttackChance: 'chance to dodge attacks'
		}
	};
});
