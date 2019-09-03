module.exports = {
	type: 'charge',

	cdMax: 20,
	manaCost: 10,
	range: 9,

	damage: 5,
	speed: 70,
	isAttack: true,

	stunDuration: 15,
	needLos: true,

	cast: function (action) {
		let obj = this.obj;
		let target = action.target;

		let x = obj.x;
		let y = obj.y;

		let dx = target.x - x;
		let dy = target.y - y;

		//We need to stop just short of the target
		let offsetX = 0;
		if (dx !== 0)
			offsetX = dx / Math.abs(dx);

		let offsetY = 0;
		if (dy !== 0)
			offsetY = dy / Math.abs(dy);

		let targetPos = {
			x: target.x,
			y: target.y
		};

		let physics = obj.instance.physics;
		//Check where we should land
		if (!this.isTileValid(physics, x, y, targetPos.x - offsetX, targetPos.y - offsetY)) {
			if (!this.isTileValid(physics, x, y, targetPos.x - offsetX, targetPos.y)) 
				targetPos.y -= offsetY;
			else 
				targetPos.x -= offsetX;
		} else {
			targetPos.x -= offsetX;
			targetPos.y -= offsetY;
		}

		let distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		let ttl = distance * this.speed;

		let targetEffect = target.effects.addEffect({
			type: 'stunned'
		});

		if (targetEffect) {
			this.obj.instance.syncer.queue('onGetDamage', {
				id: target.id,
				event: true,
				text: 'stunned'
			}, -1);
		}

		let selfEffect = this.obj.effects.addEffect({
			type: 'stunned',
			noMsg: true
		});

		this.sendAnimation({
			id: this.obj.id,
			components: [{
				type: 'moveAnimation',
				idTarget: target.id,
				targetX: targetPos.x,
				targetY: targetPos.y,
				ttl: ttl
			}]
		});

		if (this.animation) {
			this.obj.instance.syncer.queue('onGetObject', {
				id: this.obj.id,
				components: [{
					type: 'animation',
					template: this.animation
				}]
			}, -1);
		}

		physics.removeObject(obj, obj.x, obj.y);

		this.queueCallback(this.reachDestination.bind(this, target, targetPos, targetEffect, selfEffect), ttl - 50);

		return true;
	},
	reachDestination: function (target, targetPos, targetEffect, selfEffect) {
		if (this.obj.destroyed)
			return;

		let obj = this.obj;

		obj.x = targetPos.x;
		obj.y = targetPos.y;

		let syncer = obj.syncer;
		syncer.o.x = targetPos.x;
		syncer.o.y = targetPos.y;

		obj.instance.physics.addObject(obj, obj.x, obj.y);

		obj.effects.removeEffect(selfEffect, true);

		this.obj.aggro.move();

		if (targetEffect)
			targetEffect.ttl = this.stunDuration;

		let damage = this.getDamage(target);
		target.stats.takeDamage(damage, this.threatMult, obj);
	},

	isTileValid: function (physics, fromX, fromY, toX, toY) {
		if (physics.isTileBlocking(toX, toY))
			return false;
		return physics.hasLos(fromX, fromY, toX, toY);
	}
};
