module.exports = {
	type: 'stealth',

	cdMax: 0,
	manaCost: 0,

	duration: 10,

	targetGround: true,

	cast: function (action) {
		//Clear Aggro
		this.obj.aggro.die();

		let ttl = this.duration * consts.tickTime;
		let endCallback = this.queueCallback(this.endEffect.bind(this), ttl - 50);

		this.obj.effects.addEffect({
			type: 'stealth',
			endCallback: endCallback
		});		

		return true;
	},
	endEffect: function () {
		if (this.obj.destroyed)
			return;

		let obj = this.obj;

		obj.effects.removeEffectByName('stealth');
		this.obj.aggro.move();
	}
};
