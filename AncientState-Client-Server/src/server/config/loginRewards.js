const config = [{
	name: 'Iron Bar',
	sprite: [0, 0],
	quality: 0,
	chance: 15
}, {
	name: 'Cloth Scrap',
	sprite: [0, 1],
	quality: 0,
	chance: 15
}, {
	name: 'Leather Scrap',
	sprite: [0, 7],
	quality: 0,
	chance: 15
}, {
	name: 'Skyblossom',
	sprite: [1, 2],
	quality: 0,
	chance: 8
}, {
	name: 'Common Essence',
	sprite: [0, 2],
	quality: 0,
	chance: 5
}, {
	name: 'Magic Essence',
	sprite: [0, 3],
	quality: 1,
	chance: 2
}, {
	name: 'Rare Essence',
	sprite: [0, 4],
	quality: 2,
	chance: 1
}];

let pool = [];
config.forEach(function (c) {
	for (let i = 0; i < c.chance; i++) 
		pool.push(c.name);
});

module.exports = {
	generate: function (streak) {
		let items = [];
		
		const itemCount = 1 + ~~(streak / 2);

		for (let i = 0; i < itemCount; i++) {
			let pickName = pool[~~(Math.random() * pool.length)];
			const pick = config.find(f => f.name === pickName);

			let item = items.find(f => f.name === pickName);
			if (!item) {
				items.push({
					name: pick.name,
					material: true,
					quality: pick.quality,
					sprite: pick.sprite,
					quantity: 1
				});
			} else
				item.quantity++;
		}

		if (items.length > 0)
			items[0].msg = `Daily login reward for ${streak} day${(streak > 1) ? 's' : ''}:`;

		return items;
	}
};
