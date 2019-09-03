module.exports = {
	type: 'sound',

	sound: null,
	volume: 0,

	simplify: function () {
		return {
			type: 'sound',
			sound: this.sound,
			volume: this.volume
		};
	}
};
