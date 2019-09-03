define([
	'js/system/events'
], function (
	events
) {
	let resources = {
		spriteNames: [
			'tiles',
			'walls',
			'mobs',
			'bosses',
			'animBigObjects',
			'bigObjects',
			'objects',
			'characters',
			'attacks',
			'ui',
			'auras',
			'animChar',
			'animMob',
			'animBoss',
			'white',
			'ray',
			'images/skins/0001.png',
			'images/skins/0010.png',
			'images/skins/0012.png'
		],
		sprites: {},
		ready: false,
		init: function (list) {
			list.forEach(function (l) {
				this.spriteNames.push(l);
			}, this);

			this.spriteNames.forEach(function (s) {
				let sprite = {
					image: (new Image()),
					ready: false
				};
				sprite.image.src = s.indexOf('png') > -1 ? s : 'images/' + s + '.png';
				sprite.image.onload = this.onSprite.bind(this, sprite);

				this.sprites[s] = sprite;
			}, this);
		},
		onSprite: function (sprite) {
			sprite.ready = true;

			let readyCount = 0;
			for (let s in this.sprites) {
				if (this.sprites[s].ready)
					readyCount++;
			}

			if (readyCount === this.spriteNames.length)
				this.onReady();
		},
		onReady: function () {
			this.ready = true;

			events.emit('onResourcesLoaded');
		}
	};

	return resources;
});
