module.exports = {
	generate: function (item, blueprint) {
		if (!blueprint.effects)
			return;

		item.effects = blueprint.effects.map(function (e) {
			let rolls = e.rolls;
			let newRolls = {};
			for (let p in rolls) {
				let isInt = (p.indexOf('i_') === 0);
				let fieldName = p.replace('i_', '');

				let range = rolls[p];
				let value = range[0] + (Math.random() * (range[1] - range[0]));
				if (isInt)
					value = ~~value;

				newRolls[fieldName] = value;
			}

			return {
				type: e.type,
				properties: e.properties,
				rolls: newRolls
			};
		});
	}
};
