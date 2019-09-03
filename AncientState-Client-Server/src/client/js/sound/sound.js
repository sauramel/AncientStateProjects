define([
	'howler',
	'js/misc/physics'
], function (
	howler,
	physics
) {
	return {
		sounds: [],

		init: function (zone) {
			
		},

		unload: function (zoneId) {
			this.sounds.forEach(function (s) {
				if ((s.sound) && (s.zoneId !== zoneId))
					s.sound.unload();
			});

			this.sounds.spliceWhere(function (s) {
				return (s.zoneId !== zoneId);
			});
		},

		update: function (x, y) {
			this.sounds.forEach(function (s) {
				let volume;

				if (!s.w) {
					let dx = Math.abs(s.x - x);
					if (dx > 10) {
						if (s.sound)
							s.sound.volume(0);
						return;
					}
					let dy = Math.abs(s.y - y);
					if (dy > 10) {
						if (s.sound)
							s.sound.volume(0);
						return;
					}

					let dist = 10 - Math.max(dx, dy);
					dist = (dist * dist) / 100;
					volume = 0.3 * dist;
				} else if (physics.isInPolygon(x, y, s.area)) 
					volume = 0.3;
				else {
					let distance = physics.distanceToPolygon([x, y], s.area);
					if (distance > 10) {
						if (s.sound)
							s.sound.volume(0);
						return;
					}

					let dist = 10 - distance;
					dist = (dist * dist) / 100;
					volume = 0.3 * dist;
				}

				if (!s.sound) {
					//eslint-disable-next-line no-undef
					s.sound = new Howl({
						src: ['audio/' + s.file],
						autoplay: true,
						loop: true,
						volume: 0
					});
				}

				s.sound.volume(volume * s.volume);
			});
		},

		addSound: function (zoneId, file, volume, x, y, w, h, area) {
			if ((!area) && (w)) {
				area = [
					[x, y],
					[x + w, y],
					[x + w, y + h],
					[x, y + h]
				];
			}

			let sound = {
				file: file,
				x: x,
				y: y,
				w: w,
				h: h,
				volume: volume,
				area: area,
				sound: null,
				zoneId: zoneId
			};

			this.sounds.push(sound);
		}
	};
});
