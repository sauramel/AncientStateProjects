module.exports = {
	type: 'bloodBarrier',

	cdMax: 7,
	manaCost: 0,

	range: 9,

	speed: 150,
	damage: 1,

	row: 3,
	col: 0,

	needLos: true,
	autoTargetFollower: true,
	targetFriendly: true,
	noTargetSelf: true,

	cast: function (action) {
		let obj = this.obj;
		let target = action.target;

		this.sendBump(target);

		this.queueCallback(this.explode.bind(this, target), 1, null, target);

		this.sendBump({
			x: obj.x,
			y: obj.y - 1
		});

		return true;
	},
	explode: function (target) {
		if ((this.obj.destroyed) || (target.destroyed))
			return;

		let amount = (this.obj.stats.values.hpMax / 100) * this.drainPercentage;
		let damage = {
			amount: amount
		};
		this.obj.stats.takeDamage(damage, 0, this.obj);

		amount = amount * this.shieldMultiplier;
		let heal = {
			amount: amount
		};
		target.stats.getHp(heal, this.obj);

		target.spellbook.spells[0].cd = 0;
		target.effects.addEffect({
			type: 'frenzy',
			ttl: this.frenzyDuration,
			newCd: target.player ? 2 : 0
		});
	}
};
