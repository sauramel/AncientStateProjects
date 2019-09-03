let cpnSpikePatch = {
	type: 'spikePatch',

	contents: [],

	applyDamage: function (o, amount) {
		o.stats.takeDamage(amount, 1, this.caster);
	},

	collisionEnter: function (o) {
		if ((o.mob) || (!o.stats))
			return;

		this.contents.push(o);
	},

	collisionExit: function (o) {
		let contents = this.contents;
		let cLen = contents.length;
		for (let i = 0; i < cLen; i++) {
			if (contents[i] === o) {
				contents.splice(i, 1);
				return;
			}
		}
	},

	update: function () {
		if (this.caster.destroyed)
			return;

		let contents = this.contents;
		let cLen = contents.length;
		for (let i = 0; i < cLen; i++) {
			let c = contents[i];

			let amount = this.getDamage(c);
			this.applyDamage(c, amount);
		}
	}
};

module.exports = {
	type: 'trailDash',

	intCd: 0,
	intCdMax: 0,
	casting: false,

	range: 10,
	distance: 0,

	castingEffect: null,

	dx: 0,
	dy: 0,

	targetX: 0,
	targetY: 0,

	currentX: 0,
	currentY: 0,

	duration: 6,

	update: function () {
		if (!this.casting)
			return;

		if (this.intCd > 0) {
			this.intCd--;
			return;
		} 
		this.intCd = this.intCdMax;

		this.currentX += this.dx;
		this.currentY += this.dy;

		let x = ~~this.currentX;
		let y = ~~this.currentY;

		if (this.obj.instance.physics.isTileBlocking(x, y)) 
			this.distance = 7;
		else if ((x !== this.obj.x) || (y !== this.obj.y)) {
			//if ((x !== this.targetX) || (y !== this.targetY)) {
			let particles = this.particles;

			let spike = this.obj.instance.objects.buildObjects([{
				x: this.obj.x,
				y: this.obj.y,
				properties: {
					cpnHealPatch: cpnSpikePatch,
					cpnAttackAnimation: {
						simplify: function () {
							return {
								type: 'attackAnimation',
								destroyObject: true,
								row: [9, 9, 9, 9, 9, 9, 9, 9][~~(Math.random() * 8)],
								col: 4,
								frameDelay: 6 + ~~(Math.random() * 7),
								loop: -1
							};
						}
					},
					cpnParticles: {
						simplify: function () {
							return {
								type: 'particles',
								noExplosion: true,
								blueprint: particles
							};
						},
						blueprint: particles
					}
				}
			}]);
			spike.spikePatch.caster = this.obj;
			spike.spikePatch.damage = this.damage;

			this.queueCallback(null, this.spikeDuration * consts.tickTime, this.endEffect.bind(this, spike), null, true);

			this.obj.x = x;
			this.obj.y = y;

			let syncer = this.obj.syncer;
			syncer.o.x = this.obj.x;
			syncer.o.y = this.obj.y;

			this.distance++;
		} else {
			this.intCd = 0;
			this.update();
		}

		if (this.distance > 6) {
			this.casting = false;
			this.castingEffect.destroyed = true;
			return true;
		}

		return true;
	},

	endEffect: function (spike) {
		spike.destroyed = true;
	},

	cast: function (action) {
		do {
			this.targetX = action.target.x + ~~(Math.random() * 6) - 3;
			this.targetY = action.target.y + ~~(Math.random() * 6) - 3;
		} while (this.obj.instance.physics.isTileBlocking(this.targetX, this.targetY));

		this.currentX = this.obj.x;
		this.currentY = this.obj.y;

		this.dx = this.targetX - this.currentX;
		this.dy = this.targetY - this.currentY;

		let distance = Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));

		if (distance <= 0)
			return false;

		this.castingEffect = this.obj.effects.addEffect({
			type: 'casting',
			noMsg: true
		});

		this.casting = true;
		this.intCd = 0;

		this.distance = 0;

		this.dx /= distance;
		this.dy /= distance;

		return true;
	}
};
