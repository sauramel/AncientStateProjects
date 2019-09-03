define([
	'js/rendering/renderer'
], function (
	renderer
) {
	let auras = {
		reflectDamage: 0,
		stealth: 1,
		regenHp: 9,
		regenMana: 10,
		swiftness: 11,
		holyVengeance: 8,
		rare: 16
	};

	return {
		type: 'effects',

		alpha: 0,
		alphaDir: 0.0025,

		alphaMax: 0.6,
		alphaMin: 0.35,

		alphaCutoff: 0.4,

		effects: [],

		init: function (blueprint) {
			this.effects = this.effects
				.filter(function (e) {
					return (auras[e] !== null);
				}, this)
				.map(function (e) {
					return {
						name: e,
						sprite: renderer.buildObject({
							layerName: 'effects',
							sheetName: 'auras',
							x: this.obj.x - 0.5,
							y: this.obj.y - 0.5,
							w: scale * 2,
							h: scale * 2,
							cell: auras[e]
						})
					};
				}, this);
		},
		extend: function (blueprint) {
			if (blueprint.addEffects) {
				blueprint.addEffects = blueprint.addEffects
					.filter(function (e) {
						return (auras[e] !== null);
					})
					.map(function (e) {
						return {
							name: e,
							sprite: renderer.buildObject({
								layerName: 'effects',
								sheetName: 'auras',
								x: this.obj.x - 0.5,
								y: this.obj.y - 0.5,
								w: scale * 2,
								h: scale * 2,
								cell: auras[e]
							})
						};
					}, this);

				this.effects.push.apply(this.effects, blueprint.addEffects || []);
			}
			if (blueprint.removeEffects) {
				blueprint.removeEffects.forEach(function (r) {
					let effect = this.effects.find(e => e.name === r);

					if (!effect)
						return;

					renderer.destroyObject({
						layerName: 'effects',
						sprite: effect.sprite
					});

					this.effects.spliceFirstWhere(e => e.name === r);
				}, this);
			}
		},

		update: function () {
			this.alpha += this.alphaDir;
			if ((this.alphaDir > 0) && (this.alpha >= this.alphaMax)) {
				this.alpha = this.alphaMax;
				this.alphaDir *= -1;
			} else if ((this.alphaDir < 0) && (this.alpha <= this.alphaMin)) {
				this.alpha = this.alphaMin;
				this.alphaDir *= -1;
			}

			let x = (this.obj.x - 0.5) * scale;
			let y = (this.obj.y - 0.5) * scale;

			let useAlpha = this.alpha;
			if (useAlpha < this.alphaCutoff)
				useAlpha = 0;
			else {
				useAlpha -= this.alphaCutoff;
				useAlpha /= (this.alphaMax - this.alphaCutoff);
			}

			this.effects.forEach(function (e) {
				e.sprite.alpha = useAlpha;
				e.sprite.x = x;
				e.sprite.y = y;
			}, this);
		},

		destroy: function () {
			this.effects.forEach(function (e) {
				renderer.destroyObject({
					layerName: 'effects',
					sprite: e.sprite
				});
			});
		}
	};
});
