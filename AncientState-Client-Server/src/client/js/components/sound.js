define([
	'js/sound/sound'
], function (
	sound
) {
	return {
		type: 'sound',

		sound: null,
		volume: 0,

		init: function () {
			let obj = this.obj;
			sound.addSound(obj.zoneId, this.sound, this.volume, obj.x, obj.y, obj.width, obj.height, obj.area);
		}
	};
});
