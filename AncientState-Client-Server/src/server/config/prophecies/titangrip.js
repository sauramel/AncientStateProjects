module.exports = {
	type: 'titangrip',

	init: function () {

	},

	simplify: function () {
		return this.type;
	},

	events: {
		afterEquipItem: function (item) {
			if (['oneHanded', 'twoHanded'].indexOf(item.slot) === -1)
				return;

			let stats = item.stats;
			for (let s in stats) {
				let val = stats[s];

				this.obj.stats.addStat(s, val);
			}
		},
		afterUnequipItem: function (item) {
			if (['oneHanded', 'twoHanded'].indexOf(item.slot) === -1)
				return;

			let stats = item.stats;
			for (let s in stats) {
				let val = stats[s];

				this.obj.stats.addStat(s, -val);
			}
		}
	}
};
