define([
	'js/resources',
	'js/rendering/tileOpacity'
], function (
	resources,
	tileOpacity
) {
	let tileSize = 32;
	let width = 0;
	let height = 0;

	let canvas = null;
	let ctx = null;

	return {
		buildSprite: function (layers, maps, opacities) {
			width = maps[0].length;
			height = maps[0][0].length;

			if (canvas)
				canvas.remove();

			canvas = $('<canvas></canvas>')
				.appendTo('body')
				.css('display', 'none');

			canvas[0].width = width * tileSize;
			canvas[0].height = height * tileSize;

			ctx = canvas[0].getContext('2d');

			this.build(layers, maps, opacities);

			return canvas[0];
		},

		build: function (layers, maps, opacities) {
			let random = Math.random.bind(Math);

			for (let m = 0; m < maps.length; m++) {
				let map = maps[m];
				if (!map)
					continue;

				let layer = layers[m];
				let sprite = resources.sprites[layer].image;

				let opacity = opacities[m];

				for (let i = 0; i < width; i++) {
					let x = i * tileSize;
					for (let j = 0; j < height; j++) {
						let y = j * tileSize;

						let cell = map[i][j];
						if (cell === 0)
							continue;

						cell--;

						let tileY = ~~(cell / 8);
						let tileX = cell - (tileY * 8);

						let tileO = tileOpacity[layer];
						if (tileO) {
							if (tileO[cell])
								ctx.globalAlpha = tileO[cell];
							else
								ctx.globalAlpha = opacity;
						} else
							ctx.globalAlpha = opacity;

						if (random() > 0.5) {
							ctx.drawImage(
								sprite, 
								tileX * tileSize, 
								tileY * tileSize, 
								tileSize, 
								tileSize, 
								x, 
								y, 
								tileSize, 
								tileSize
							);
						} else {
							ctx.save();
							ctx.scale(-1, 1);
							ctx.drawImage(
								sprite,
								tileX * tileSize,
								tileY * tileSize,
								tileSize,
								tileSize, 
								-x,
								y, 
								-tileSize,
								tileSize
							);
							ctx.restore();
						}
					}
				}
			}
		}
	};
});
