define([
	'js/rendering/renderer',
	'js/system/events',
	'js/system/client'
], function (
	renderer,
	events,
	client
) {
	let round = Math.round.bind(Math);
	let maxPathLength = 50;

	return {
		type: 'pather',

		path: [],

		pathColor: '0x48edff',
		pathAlpha: 0.2,

		pathPos: {
			x: 0,
			y: 0
		},

		lastX: 0,
		lastY: 0,

		init: function () {
			events.on('onDeath', this.onDeath.bind(this));
			events.on('onClearQueue', this.onDeath.bind(this));

			this.pathPos.x = round(this.obj.x);
			this.pathPos.y = round(this.obj.y);
		},

		clearPath: function () {
			this.path.forEach(function (p) {
				renderer.destroyObject({
					layerName: 'effects',
					sprite: p.sprite
				});
			});		

			this.path = [];
		},

		onDeath: function () {
			this.clearPath();
			
			this.pathPos.x = round(this.obj.x);
			this.pathPos.y = round(this.obj.y);
		},

		add: function (x, y) {
			if (this.path.length >= maxPathLength || this.obj.moveAnimation)
				return;

			this.pathPos.x = x;
			this.pathPos.y = y;

			this.path.push({
				x: x,
				y: y,
				sprite: renderer.buildRectangle({
					layerName: 'effects',
					color: this.pathColor,
					alpha: this.pathAlpha,
					x: (x * scale) + scaleMult,
					y: (y * scale) + scaleMult,
					w: scale - (scaleMult * 2),
					h: scale - (scaleMult * 2)
				})
			});

			client.request({
				cpn: 'player',
				method: 'move',
				priority: !this.path.length,
				data: {
					x: x,
					y: y
				}
			});
		},

		update: function () {
			if (this.obj.moveAnimation)
				this.clearPath();

			let x = this.obj.x;
			let y = this.obj.y;

			if (this.path.length === 0) {
				this.pathPos.x = round(x);
				this.pathPos.y = round(y);
			}

			if ((x === this.lastX) && (y === this.lastY))
				return;

			this.lastX = x;
			this.lastY = y;

			for (let i = 0; i < this.path.length; i++) {
				let p = this.path[i];

				if ((p.x === x) && (p.y === y)) {
					for (let j = 0; j <= i; j++) {
						renderer.destroyObject({
							layerName: 'effects',
							sprite: this.path[j].sprite
						});
					}
					this.path.splice(0, i + 1);
					return;
				}
			}
		},

		destroy: function () {
			this.unhookEvents();
		}
	};
});
