const effectTemplate = require('../config/effects/effectTemplate');

module.exports = {
	type: 'effects',

	effects: [],
	nextId: 0,

	ccResistances: {
		stunned: 0,
		slowed: 0
	},

	init: function (blueprint) {
		let effects = blueprint.effects || [];
		let eLen = effects.length;
		for (let i = 0; i < eLen; i++) {
			let e = effects[i];
			if (!e.type)
				continue;

			this.addEffect(e);
		}

		delete blueprint.effects;
	},

	transfer: function () {
		let transferEffects = this.effects;
		this.effects = [];

		this.init({
			effects: transferEffects
		});
	},

	save: function () {
		let e = {
			type: 'effects',
			effects: this.effects
				.map(f => f.save ? f.save() : f)
				.filter(f => !!f)
		};

		return e;
	},

	simplify: function (self) {
		let e = {
			type: 'effects'
		};

		let effects = this.effects;
		if ((effects.length > 0) && (effects[0].obj)) {
			effects = effects
				.map(f => f.simplify())
				.filter(f => !!f);
		}
		e.effects = effects;

		return e;
	},

	destroy: function () {
		if (this.obj.instance)
			this.events.beforeRezone.call(this);
	},

	die: function () {
		this.events.beforeRezone.call(this, true);
	},

	reset: function () {
		let effects = this.effects;
		let eLen = effects.length;
		for (let i = 0; i < eLen; i++) {
			let effect = effects[i];

			if (effect.reset)
				effect.reset();
		}
	},

	reapply: function () {
		let effects = this.effects;
		let eLen = effects.length;
		for (let i = 0; i < eLen; i++) {
			let effect = effects[i];

			if (effect.reapply)
				effect.reapply();
		}
	},

	events: {
		beforeRezone: function (forceDestroy) {
			let effects = this.effects;
			let eLen = effects.length;
			for (let i = 0; i < eLen; i++) {
				let effect = effects[i];
				if (!forceDestroy) {
					if (effect.persist) {
						this.syncRemove(effect.id, effect.type);
						continue;
					}
				}

				if (effect.destroy)
					effect.destroy();

				this.syncRemove(effect.id, effect.type);
				effects.splice(i, 1);
				eLen--;
				i--;
			}
		}
	},

	canApplyEffect: function (type) {
		if (!this.ccResistances.has(type))
			return true;

		let ccResistances = this.ccResistances;
		if ((100 - ccResistances[type]) >= 50) {
			ccResistances[type] += 50;
			return true;
		} return false;
	},

	addEffect: function (options, source) {
		if ((options.has('ttl')) && (options.ttl === 0))
			return;

		options.caster = options.caster || source;

		if (!this.canApplyEffect(options.type))
			return;

		if (!options.new) {
			let exists = this.effects.find(e => e.type === options.type);
			if (exists) {
				exists.ttl += options.ttl;

				for (let p in options) {
					if (p === 'ttl')
						continue;

					exists[p] = options[p];
				}

				return exists;
			}
		}

		let typeTemplate = null;
		if (options.type) {
			let type = options.type[0].toUpperCase() + options.type.substr(1);
			let result = {
				type: type,
				url: 'config/effects/effect' + type + '.js'
			};
			this.obj.instance.eventEmitter.emit('onBeforeGetEffect', result);

			typeTemplate = require('../' + result.url);
		}

		let builtEffect = extend({}, effectTemplate, typeTemplate);
		for (let p in options) 
			builtEffect[p] = options[p];
		
		builtEffect.obj = this.obj;
		builtEffect.id = this.nextId++;
		builtEffect.noMsg = options.noMsg;

		if (builtEffect.init)
			builtEffect.init(options.source);

		this.effects.push(builtEffect);

		if (!options.noMsg) {
			this.obj.instance.syncer.queue('onGetBuff', {
				type: options.type,
				id: builtEffect.id
			}, [this.obj.serverId]);

			this.obj.instance.syncer.queue('onGetDamage', {
				id: this.obj.id,
				event: true,
				text: '+' + options.type
			}, -1);

			this.obj.syncer.setArray(false, 'effects', 'addEffects', options.type);
		}

		return builtEffect;
	},

	syncRemove: function (id, type, noMsg) {
		if ((noMsg) || (!type))
			return;

		this.obj.instance.syncer.queue('onRemoveBuff', {
			id: id
		}, [this.obj.serverId]);

		this.obj.instance.syncer.queue('onGetDamage', {
			id: this.obj.id,
			event: true,
			text: '-' + type
		}, -1);

		this.obj.syncer.setArray(false, 'effects', 'removeEffects', type);
	},

	removeEffect: function (checkEffect, noMsg) {
		let effects = this.effects;
		let eLen = effects.length;
		for (let i = 0; i < eLen; i++) {
			let effect = effects[i];
			if (effect === checkEffect) {
				if (effect.destroy)
					effect.destroy();
				this.syncRemove(effect.id, effect.type, noMsg || effect.noMsg);
				effects.splice(i, 1);

				return;
			}
		}
	},
	removeEffectByName: function (effectName, noMsg) {
		let effects = this.effects;
		let eLen = effects.length;
		for (let i = 0; i < eLen; i++) {
			let effect = effects[i];
			if (effect.type === effectName) {
				this.syncRemove(effect.id, effect.type, noMsg || effects.noMsg);
				effects.splice(i, 1);

				if (effect.destroy)
					effect.destroy();
				
				return effect;
			}
		}
	},

	fireEvent: function (event, args) {
		let effects = this.effects;
		let eLen = effects.length;
		for (let i = 0; i < eLen; i++) {
			let e = effects[i];

			//Maybe the effect killed us?
			if (!e) {
				i--;
				eLen--;
				continue;
			}

			if (e.ttl === 0)
				continue;
			let events = e.events;
			if (!events)
				continue;

			let callback = events[event];
			if (!callback)
				continue;

			callback.apply(e, args);
		}
	},

	update: function () {
		let effects = this.effects;
		let eLen = effects.length;
		for (let i = 0; i < eLen; i++) {
			let e = effects[i];

			if (e.ttl > 0) {
				e.ttl--;
				if (e.ttl === 0)
					e.destroyed = true;
			}

			if (e.update)
				e.update();

			if (e.destroyed) {
				effects.splice(i, 1);
				eLen--;
				i--;

				if (e.destroy)
					e.destroy();

				this.syncRemove(e.id, e.type, e.noMsg);
			}
		}

		for (let p in this.ccResistances) {
			if (this.ccResistances[p] > 0)
				this.ccResistances[p]--;
		}
	}
};
