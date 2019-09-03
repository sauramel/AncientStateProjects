module.exports = {
	type: 'fireblast',

	targetGround: true,
	targetPlayerPos: true,

	radius: 2,
	pushback: 4,

	cast: function (action) {
		let obj = this.obj;

		let radius = this.radius;

		let x = obj.x;
		let y = obj.y;

		let physics = obj.instance.physics;
		let syncer = obj.instance.syncer;

		for (let i = x - radius; i <= x + radius; i++) {
			for (let j = y - radius; j <= y + radius; j++) {
				if (!physics.hasLos(~~x, ~~y, ~~i, ~~j))
					continue;

				let effect = {
					x: i,
					y: j,
					components: [{
						type: 'particles',
						ttl: 10,
						blueprint: this.particles
					}]
				};

				if ((i !== x) || (j !== y))
					syncer.queue('onGetObject', effect, -1);

				let mobs = physics.getCell(i, j);
				let mLen = mobs.length;
				for (let k = 0; k < mLen; k++) {
					let m = mobs[k];

					//Maybe we killed something?
					if (!m) {
						mLen--;
						continue;
					}

					if ((!m.aggro) || (!m.effects))
						continue;

					if (!this.obj.aggro.canAttack(m))
						continue;

					let targetEffect = m.effects.addEffect({
						type: 'stunned',
						noMsg: true
					});

					let targetPos = {
						x: m.x,
						y: m.y
					};

					//Find out where the mob should end up
					let dx = m.x - obj.x;
					let dy = m.y - obj.y;

					while ((dx === 0) && (dy === 0)) {
						dx = ~~(Math.random() * 2) - 1;
						dy = ~~(Math.random() * 2) - 1;
					}

					dx = ~~(dx / Math.abs(dx));
					dy = ~~(dy / Math.abs(dy));
					for (let l = 0; l < this.pushback; l++) {
						if (physics.isTileBlocking(targetPos.x + dx, targetPos.y + dy)) {
							if (physics.isTileBlocking(targetPos.x + dx, targetPos.y)) {
								if (physics.isTileBlocking(targetPos.x, targetPos.y + dy)) 
									break;
								else {
									dx = 0;
									targetPos.y += dy;
								}
							} else {
								dy = 0;
								targetPos.x += dx;
							}
						} else {
							targetPos.x += dx;
							targetPos.y += dy;
						}
					}

					let distance = Math.max(Math.abs(m.x - targetPos.x), Math.abs(m.y - targetPos.y));
					let ttl = distance * 125;

					m.clearQueue();

					this.sendAnimation({
						id: m.id,
						components: [{
							type: 'moveAnimation',
							targetX: targetPos.x,
							targetY: targetPos.y,
							ttl: ttl
						}]
					});

					let damage = this.getDamage(m);
					m.stats.takeDamage(damage, 1, obj);

					if (!m.destroyed) {
						physics.removeObject(m, m.x, m.y);
						this.queueCallback(this.endEffect.bind(this, m, targetPos, targetEffect), ttl, null, m);
					}
				}
			}
		}

		this.sendBump({
			x: x,
			y: y - 1
		});

		return true;
	},

	endEffect: function (target, targetPos, targetEffect) {
		target.effects.removeEffect(targetEffect, true);

		target.x = targetPos.x;
		target.y = targetPos.y;

		let syncer = target.syncer;
		syncer.o.x = targetPos.x;
		syncer.o.y = targetPos.y;

		target.instance.physics.addObject(target, target.x, target.y);
	}
};
