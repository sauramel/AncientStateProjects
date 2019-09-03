define([
	'js/system/events',
	'js/rendering/renderer'
], function (
	events,
	renderer
) {
	return {
		type: 'stats',

		values: null,

		hpSprite: null,
		hpSpriteInner: null,

		init: function (blueprint) {
			if (this.obj.self)
				events.emit('onGetStats', this.values);

			if (this.obj.has('serverId'))
				events.emit('onGetPartyStats', this.obj.serverId, this.values);

			let obj = this.obj;

			this.hpSprite = renderer.buildRectangle({
				layerName: 'effects',
				x: obj.x * scale,
				y: obj.y * scale,
				w: 1,
				h: 1,
				color: 0x802343
			});

			this.hpSpriteInner = renderer.buildRectangle({
				x: 0,
				y: 0,
				w: 1,
				h: 1,
				layerName: 'effects',
				color: 0xd43346
			});

			this.updateHpSprite();
		},

		updateHpSprite: function () {
			if (this.obj.dead)
				return;

			let obj = this.obj;

			let yOffset = -12;
			let sprite = this.obj.sprite;
			if (sprite)
				yOffset = (sprite.height / 2) - 10;

			let x = obj.x * scale;
			let y = (obj.y * scale) - yOffset;

			renderer.moveRectangle({
				sprite: this.hpSprite,
				x: x + 4,
				y: y,
				w: (scale - 8),
				h: 5
			});

			renderer.moveRectangle({
				sprite: this.hpSpriteInner,
				x: x + 4,
				y: y,
				w: (this.values.hp / this.values.hpMax) * (scale - 8),
				h: 5
			});

			this.hpSprite.visible = (this.values.hp < this.values.hpMax);
			this.hpSpriteInner.visible = this.hpSprite.visible;
		},

		extend: function (blueprint) {	
			let bValues = blueprint.values || {};

			let values = this.values;

			for (let b in bValues) 
				values[b] = bValues[b];

			if (this.obj.self)
				events.emit('onGetStats', this.values);

			if (this.obj.has('serverId'))
				events.emit('onGetPartyStats', this.obj.serverId, this.values);

			this.updateHpSprite();
		},

		destroy: function () {
			renderer.destroyObject({
				sprite: this.hpSprite,
				layerName: 'effects'
			});

			renderer.destroyObject({
				sprite: this.hpSpriteInner,
				layerName: 'effects'
			});
		}
	};
});
