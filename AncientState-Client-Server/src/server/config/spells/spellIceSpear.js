module.exports = {
	type: 'iceSpear',

	cdMax: 7,
	manaCost: 0,

	range: 9,

	speed: 70,
	damage: 1,

	freezeDuration: 10,

	needLos: true,

	cast: function (action) {
		let obj = this.obj;
		let target = action.target;

		let ttl = Math.sqrt(Math.pow(target.x - obj.x, 2) + Math.pow(target.y - obj.y, 2)) * this.speed;

		let projectileConfig = {
			caster: this.obj.id,
			components: [{
				idSource: this.obj.id,
				idTarget: target.id,
				type: 'projectile',
				row: 3,
				col: 0,
				ttl: ttl,
				particles: this.particles
			}, {
				type: 'attackAnimation',
				layer: 'projectiles',
				loop: -1,
				row: 3,
				col: 4
			}]
		};

		this.obj.fireEvent('beforeSpawnProjectile', this, projectileConfig);

		this.sendAnimation(projectileConfig);

		this.sendBump(target);

		this.queueCallback(this.explode.bind(this, target), ttl);

		return true;
	},
	explode: function (target) {
		if (this.obj.destroyed)
			return;

		let targetEffect = target.effects.addEffect({
			type: 'slowed',
			ttl: this.freezeDuration
		});

		if (targetEffect) {
			this.obj.instance.syncer.queue('onGetDamage', {
				id: target.id,
				event: true,
				text: 'slowed'
			}, -1);
		}

		let damage = this.getDamage(target);
		target.stats.takeDamage(damage, this.threatMult, this.obj);
	}
};
