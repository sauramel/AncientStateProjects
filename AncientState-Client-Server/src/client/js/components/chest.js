define([

], function (

) {
	let colors = [
		'929398',
		'80f643',
		'3fa7dd',
		'a24eff',
		'ffeb38'
	];

	let chances = [
		0.0075,
		0.02,
		0.04,
		0.08,
		0.095
	];

	let indices = {
		50: 0,
		51: 1,
		128: 2,
		52: 3,
		53: 4
	};

	return {
		type: 'chest',

		ownerName: null,

		init: function (blueprint) {
			if (this.ownerName && (!window.player || window.player.name !== this.ownerName)) {
				this.obj.sheetName = null;
				return;
			}

			let index = indices[this.obj.cell];

			this.obj.addComponent('particles', {
				chance: chances[index],
				blueprint: {
					color: {
						start: colors[index]
					},
					alpha: {
						start: 0.75,
						end: 0.2
					},
					lifetime: {
						min: 1,
						max: 4
					},
					chance: chances[index],
					spawnType: 'rect',
					spawnRect: {
						x: -4,
						y: -4,
						w: 8,
						h: 8
					}
				}
			});
		}
	};
});
