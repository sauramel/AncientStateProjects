define([
	'js/rendering/renderer',
	'picture'
], function (
	renderer,
	picture
) {
	return {
		type: 'lightPatch',

		color: 'f7ffb2',
		patches: [],
		rays: [],

		init: function (blueprint) {
			this.blueprint = this.blueprint || {};

			let obj = this.obj;

			let x = obj.x;
			let y = obj.y;

			let maxDistance = Math.sqrt(Math.pow(obj.width / 2, 2) + Math.pow(obj.height / 2, 2));
			for (let i = 0; i < obj.width; i++) {
				for (let j = 0; j < obj.height; j++) {
					let distance = maxDistance - Math.sqrt(Math.pow((obj.width / 2) - i, 2) + Math.pow((obj.width / 2) - i, 2));
					let alpha = distance / maxDistance;

					let sprite = renderer.buildObject({
						x: (x + i),
						y: (y + j),
						sheetName: 'white',
						cell: 0,
						layerName: 'lightPatches'
					});
					sprite.alpha = (0.2 + (Math.random() * 1)) * alpha;
					sprite.tint = '0x' + this.color;

					sprite.blendMode = PIXI.BLEND_MODES.OVERLAY;
					sprite.pluginName = 'picture';

					this.patches.push(sprite);
				}
			}

			let rCount = ((obj.width * obj.height) / 10) + ~~(Math.random() + 2);
			for (let i = 0; i < rCount; i++) {
				let nx = x + 3 + ~~(Math.random() * (obj.width - 1));
				let ny = y - 4 + ~~(Math.random() * (obj.height));
				let w = 1 + ~~(Math.random() * 2);
				let h = 6 + ~~(Math.random() * 13);
				let hm = 2;

				let rContainer = renderer.buildContainer({
					layerName: 'lightBeams'
				});
				this.rays.push(rContainer);

				for (let j = 0; j < h; j++) {
					let ray = renderer.buildObject({
						x: nx,
						y: ny,
						cell: 0,
						sheetName: 'white',
						parent: rContainer
					});
					ray.x = ~~((nx * scale) - (scaleMult * j));
					ray.y = (ny * scale) + (scaleMult * j * hm);
					ray.alpha = ((1.0 - (j / h)) * 0.4);
					ray.width = w * scaleMult;
					ray.height = scaleMult * hm;
					ray.tint = 0xffeb38;
					ray.blendMode = PIXI.BLEND_MODES.ADD;
				}
			}
		},

		update: function () {
			let rays = this.rays;
			let rLen = rays.length;
			for (let i = 0; i < rLen; i++) {
				let r = rays[i];

				r.alpha += (Math.random() * 0.03) - 0.015;
				if (r.alpha < 0.3)
					r.alpha = 0.3;
				else if (r.alpha > 1)
					r.alpha = 1;
			}
		},

		setVisible: function (visible) {
			this.patches.forEach(function (p) {
				p.visible = visible;
			});

			this.rays.forEach(function (r) {
				r.visible = visible;
			});
		},

		destroy: function () {
			this.patches.forEach(function (p) {
				p.parent.removeChild(p);
			});
			this.patches = [];

			this.rays.forEach(function (r) {
				r.parent.removeChild(r);
			});
			this.rays = [];
		}
	};
});
