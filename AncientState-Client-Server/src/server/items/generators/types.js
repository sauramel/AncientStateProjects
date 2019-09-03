let configTypes = require('../config/types');
let armorMaterials = require('../config/armorMaterials');

module.exports = {
	generate: function (item, blueprint) {
		let type = blueprint.type || _.randomKey(configTypes.types[item.slot]);
		let typeBlueprint = configTypes.types[item.slot][type] || {};

		if (!typeBlueprint)
			return;

		item.type = type;
		item.sprite = extend([], blueprint.sprite || typeBlueprint.sprite);
		if (typeBlueprint.spritesheet)
			item.spritesheet = typeBlueprint.spritesheet;

		if (typeBlueprint.spellName) {
			blueprint.spellName = typeBlueprint.spellName;
			blueprint.spellConfig = typeBlueprint.spellConfig;
		}

		if (typeBlueprint.range)
			item.range = typeBlueprint.range;

		if (typeBlueprint.material) {
			let material = armorMaterials[typeBlueprint.material];
			blueprint.attrRequire = material.attrRequire;
		}

		if (typeBlueprint.implicitStat)
			blueprint.implicitStat = typeBlueprint.implicitStat;

		if (typeBlueprint.attrRequire)
			blueprint.attrRequire = typeBlueprint.attrRequire;
	}
};
