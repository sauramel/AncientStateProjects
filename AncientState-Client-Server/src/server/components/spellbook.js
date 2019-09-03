let spellTemplate = require('../config/spells/spellTemplate');
let animations = require('../config/animations');
let playerSpells = require('../config/spells');
let playerSpellsConfig = require('../config/spellsConfig');

module.exports = {
	type: 'spellbook',

	spells: [],

	physics: null,
	objects: null,

	closestRange: -1,
	furthestRange: -1,

	callbacks: [],

	init: function (blueprint) {
		this.objects = this.obj.instance.objects;
		this.physics = this.obj.instance.physics;

		this.dmgMult = blueprint.dmgMult;

		(blueprint.spells || []).forEach(s => this.addSpell(s, -1));

		delete blueprint.spells;
	},

	transfer: function () {
		let spells = this.spells;
		this.spells = [];

		spells.forEach(s => this.addSpell(s, -1));
	},

	die: function () {
		this.stopCasting();

		this.spells.forEach(s => {
			let reserve = s.manaReserve;

			if (reserve && reserve.percentage && s.active) {
				let reserveEvent = {
					spell: s.name,
					reservePercent: reserve.percentage
				};
				this.obj.fireEvent('onBeforeReserveMana', reserveEvent);
				this.obj.stats.addStat('manaReservePercent', -reserveEvent.reservePercent);
			}

			s.die();
		}, this);
	},

	simplify: function (self) {
		if (!self)
			return null;

		let s = {
			type: this.type,
			closestRange: this.closestRange,
			furthestRange: this.furthestRange
		};

		let spells = this.spells;
		if (spells.length && spells[0].obj) 
			spells = spells.map(f => f.simplify());
		
		s.spells = spells;

		return s;
	},

	addSpell: function (options, spellId) {
		if (!options.type) {
			options = {
				type: options
			};
		}

		let type = options.type[0].toUpperCase() + options.type.substr(1);

		let typeTemplate = {
			type: type,
			template: null
		};
		this.obj.instance.eventEmitter.emit('onBeforeGetSpellTemplate', typeTemplate);
		if (!typeTemplate.template)
			typeTemplate.template = require('../config/spells/spell' + type);

		let builtSpell = extend({}, spellTemplate, typeTemplate.template, options);
		builtSpell.obj = this.obj;
		builtSpell.baseDamage = builtSpell.damage || 0;
		builtSpell.damage += (options.damageAdd || 0);
		if (options.damage)
			builtSpell.damage = options.damage;

		if (builtSpell.animation) {
			let animation = null;
			let sheetName = this.obj.sheetName || '../../../images/characters.png';
			let animationName = builtSpell.animation;

			if (sheetName === 'mobs')
				animation = animations.mobs;
			else if (sheetName === 'bosses')
				animation = animations.bosses;
			else if (sheetName.indexOf('/') > -1)
				animation = animations.mobs[sheetName];
			else
				animation = animations.classes;

			if ((animation) && (animation[this.obj.cell]) && (animation[this.obj.cell][animationName])) {
				builtSpell.animation = extend({}, animation[this.obj.cell][animationName]);
				builtSpell.animation.name = animationName;
			} else
				builtSpell.animation = null;
		}

		if (!builtSpell.castOnDeath && builtSpell.range) {
			if (this.closestRange === -1 || builtSpell.range < this.closestRange) 
				this.closestRange = builtSpell.range;
			if (this.furthestRange === -1 || builtSpell.range > this.furthestRange)
				this.furthestRange = builtSpell.range;
		}

		if ((!options.has('id')) && (spellId === -1)) {
			spellId = 0;
			this.spells.forEach(function (s) {
				if (s.id >= spellId)
					spellId = s.id + 1;
			});
		}

		builtSpell.id = !options.has('id') ? spellId : options.id;
		if (builtSpell.cdMax)
			builtSpell.cd = builtSpell.cdMax;

		this.spells.push(builtSpell);
		this.spells.sort(function (a, b) {
			return (a.id - b.id);
		});

		builtSpell.calcDps(null, true);
		if (builtSpell.init)
			builtSpell.init();

		if (this.obj.player)
			this.obj.syncer.setArray(true, 'spellbook', 'getSpells', builtSpell.simplify());

		return builtSpell.id;
	},

	addSpellFromRune: function (runeSpell, spellId) {
		let type = runeSpell.type;
		let playerSpell = playerSpells.spells.find(s => (s.name.toLowerCase() === runeSpell.name.toLowerCase())) || playerSpells.spells.find(s => (s.type === type));
		let playerSpellConfig = playerSpellsConfig.spells[runeSpell.name.toLowerCase()] || playerSpellsConfig.spells[runeSpell.type];
		if (!playerSpellConfig)
			return -1;

		if (!runeSpell.rolls)
			runeSpell.rolls = {};

		runeSpell.values = {};

		let builtSpell = extend({
			type: runeSpell.type,
			values: {}
		}, playerSpell, playerSpellConfig, runeSpell);

		for (let r in builtSpell.random) {
			let range = builtSpell.random[r];
			let roll = runeSpell.rolls[r] || 0;
			runeSpell.rolls[r] = roll;

			let int = r.indexOf('i_') === 0;

			let val = range[0] + ((range[1] - range[0]) * roll);
			if (int) {
				val = ~~val;
				r = r.replace('i_', '');
			} else
				val = ~~(val * 100) / 100;

			builtSpell[r] = val;
			builtSpell.values[r] = val;
			runeSpell.values[r] = val;
		}

		if (runeSpell.properties) {
			for (let p in runeSpell.properties) 
				builtSpell[p] = runeSpell.properties[p];
		}

		if (runeSpell.cdMult)
			builtSpell.cdMax *= runeSpell.cdMult;

		delete builtSpell.rolls;
		delete builtSpell.random;

		return this.addSpell(builtSpell, spellId);
	},

	calcDps: function () {
		this.spells.forEach(s => s.calcDps());
	},

	removeSpellById: function (id) {
		let exists = this.spells.spliceFirstWhere(s => (s.id === id));

		if (exists) {
			if (exists.manaReserve && exists.active) {
				let reserve = exists.manaReserve;

				if (reserve.percentage) {
					let reserveEvent = {
						spell: exists.name,
						reservePercent: reserve.percentage
					};
					this.obj.fireEvent('onBeforeReserveMana', reserveEvent);
					this.obj.stats.addStat('manaReservePercent', -reserveEvent.reservePercent);
				}
			}

			if (exists.unlearn)
				exists.unlearn();

			this.obj.syncer.setArray(true, 'spellbook', 'removeSpells', id);
		}
	},

	queueAuto: function (action, spell) {
		if (!action.auto || spell.autoActive)
			return true;

		this.spells.forEach(s => s.setAuto(null));

		spell.setAuto({
			target: action.target,
			spell: spell.id
		});
	},

	getRandomSpell: function (target) {
		let valid = [];
		this.spells.forEach(function (s) {
			if (s.castOnDeath)
				return;

			if (s.canCast(target))
				valid.push(s.id);
		});

		if (valid.length > 0)
			return valid[~~(Math.random() * valid.length)];
		return null;
	},

	getTarget: function (spell, action) {
		let target = action.target;

		//Cast on self?
		if (action.self) {
			if (spell.targetGround) {
				target = {
					x: this.obj.x,
					y: this.obj.y
				};
			} else if (spell.spellType === 'buff') 
				target = this.obj;
		}

		if (!spell.aura && !spell.targetGround) {
			//Did we pass in the target id?
			if (target && !target.id) {
				target = this.objects.objects.find(o => o.id === target);
				if (!target)
					return null;
			}

			if (target === this.obj && spell.noTargetSelf)
				target = null;

			if (!target || !target.player) {
				if (spell.autoTargetFollower) {
					target = this.spells.find(s => s.minions && s.minions.length > 0);
					if (target)
						target = target.minions[0];
					else
						return null;
				}
			}

			if (spell.spellType === 'buff') {
				if (this.obj.aggro.faction !== target.aggro.faction)
					return;
			} else if (target.aggro && !this.obj.aggro.canAttack(target)) {
				if (this.obj.player)
					this.sendAnnouncement("You don't feel like attacking that target");
				return;
			}
		}

		if (!spell.targetGround && target && !target.aggro && !spell.aura) {
			this.sendAnnouncement("You don't feel like attacking that target");
			return;
		}

		if (spell.aura)
			target = this.obj;

		return target;
	},

	canCast: function (action) {
		if (!action.has('spell'))
			return false;

		let spell = this.spells.find(s => (s.id === action.spell));

		if (!spell)
			return false;

		let target = this.getTarget(spell, action);

		return spell.canCast(target);
	},

	cast: function (action, isAuto) {
		if (!action.has('spell')) {
			this.stopCasting();
			return true;
		}

		let spell = this.spells.find(s => (s.id === action.spell));
		if (!spell)
			return false;

		action.target = this.getTarget(spell, action);
		if (!action.target)
			return false;

		action.auto = spell.auto;

		let success = true;
		if (spell.cd > 0) {
			if (!isAuto) {
				let type = (spell.auto) ? 'Weapon' : 'Spell';
				this.sendAnnouncement(`${type} is on cooldown`);
			}
			success = false;
		} else if (spell.manaCost > this.obj.stats.values.mana) {
			if (!isAuto)
				this.sendAnnouncement('Insufficient mana to cast spell');
			success = false;
		} else if (spell.manaReserve) {
			let reserve = spell.manaReserve;

			if (reserve.percentage) {
				let reserveEvent = {
					spell: spell.name,
					reservePercent: reserve.percentage
				};
				this.obj.fireEvent('onBeforeReserveMana', reserveEvent);

				if (!spell.active) {
					if (1 - this.obj.stats.values.manaReservePercent < reserve.percentage) {
						this.sendAnnouncement('Insufficient mana to cast spell');
						success = false;
					} else
						this.obj.stats.addStat('manaReservePercent', reserveEvent.reservePercent);
				} else
					this.obj.stats.addStat('manaReservePercent', -reserveEvent.reservePercent);
			}
		} else if (spell.has('range')) {
			let distance = Math.max(Math.abs(action.target.x - this.obj.x), Math.abs(action.target.y - this.obj.y));
			let range = spell.range;
			if ((spell.useWeaponRange) && (this.obj.player)) {
				let weapon = this.obj.inventory.findItem(this.obj.equipment.eq.oneHanded) || this.obj.inventory.findItem(this.obj.equipment.eq.twoHanded);
				if (weapon)
					range = weapon.range || 1;
			}

			if (distance > range) {
				if (!isAuto)
					this.sendAnnouncement('Target out of range');
				success = false;
			}
		}

		//LoS check
		//Null means we don't have LoS and as such, we should move
		if (spell.needLos && success) {
			if (!this.physics.hasLos(~~this.obj.x, ~~this.obj.y, ~~action.target.x, ~~action.target.y)) {
				if (!isAuto)
					this.sendAnnouncement('Target not in line of sight');
				action.auto = false;
				success = null;
			}
		}

		if (!success) {
			this.queueAuto(action, spell);
			return success;
		} else if (!this.queueAuto(action, spell))
			return false;

		let castSuccess = {
			success: true
		};
		this.obj.fireEvent('beforeCastSpell', castSuccess);
		if (!castSuccess.success)
			return false;

		if (spell.targetFurthest)
			spell.target = this.obj.aggro.getFurthest();
		else if (spell.targetRandom)
			spell.target = this.obj.aggro.getRandom();

		success = spell.castBase(action);
		this.stopCasting(spell, true);

		if (success) {
			spell.consumeMana();
			spell.setCd();
		}

		//Null means we didn't fail but are initiating casting
		return (success === null || success === true);
	},

	getClosestRange: function (spellNum) {
		if (spellNum)
			return this.spells[spellNum].range;
		return this.closestRange;
	},

	getFurthestRange: function (spellNum, checkCanCast) {
		if (spellNum)
			return this.spells[spellNum].range;
		
		let spells = this.spells;
		let sLen = spells.length;
		let furthest = 0;
		for (let i = 0; i < sLen; i++) {
			let spell = spells[i];
			if (spell.range > furthest && (!checkCanCast || spell.canCast()))
				furthest = spell.range;
		}

		return furthest;
	},

	getCooldowns: function () {
		let cds = [];
		this.spells.forEach(
			s => cds.push({
				cd: s.cd,
				cdMax: s.cdMax,
				canCast: ((s.manaCost <= this.obj.stats.values.mana) && (s.cd === 0))
			}), this);

		return cds;
	},

	update: function () {
		let didCast = false;
		const isCasting = this.isCasting();

		this.spells.forEach(s => {
			let auto = s.autoActive;
			if (auto) {
				if (!auto.target || auto.target.destroyed)
					s.setAuto(null);
				else if (!isCasting && this.cast(auto, true))
					didCast = true;
			}

			s.updateBase();
			if (s.update)
				s.update();
		});

		let callbacks = this.callbacks;
		let cLen = callbacks.length;
		for (let i = 0; i < cLen; i++) {
			let c = callbacks[i];

			//If a spellCallback kills a mob he'll unregister his callbacks
			if (!c) {
				i--;
				cLen--;
				continue;
			}

			c.time -= consts.tickTime;

			if (c.time <= 0) {
				if (c.callback)
					c.callback();
				if (c.destroyCallback)
					c.destroyCallback();
				callbacks.splice(i, 1);
				i--;
				cLen--;
			}
		}

		return didCast || isCasting;
	},

	registerCallback: function (sourceId, callback, time, destroyCallback, targetId, destroyOnRezone) {
		let obj = {
			sourceId: sourceId,
			targetId: targetId,
			callback: callback,
			destroyCallback: destroyCallback,
			destroyOnRezone: destroyOnRezone,
			time: time
		};

		this.callbacks.push(obj);

		return obj;
	},

	unregisterCallback: function (objId, isTarget) {
		let callbacks = this.callbacks;
		let cLen = callbacks.length;
		for (let i = 0; i < cLen; i++) {
			let c = callbacks[i];
			if (
				(
					isTarget &&
					c.targetId === objId
				) ||
				(
					!isTarget &&
					c.sourceId === objId
				)
			) {
				if (c.destroyCallback)
					c.destroyCallback();
				
				callbacks.splice(i, 1);
				i--;
				cLen--;
			}
		}
	},

	sendAnnouncement: function (msg) {
		process.send({
			method: 'events',
			data: {
				onGetAnnouncement: [{
					obj: {
						msg: msg
					},
					to: [this.obj.serverId]
				}]
			}
		});
	},

	fireEvent: function (event, args) {
		let spells = this.spells;
		let sLen = spells.length;
		for (let i = 0; i < sLen; i++) {
			let s = spells[i];

			let spellEvents = s.events;
			if (spellEvents) {
				let callback = spellEvents[event];
				if (!callback)
					continue;

				callback.apply(s, args);
			}

			if (s.castEvent === event)
				s.cast();
		}
	},

	isCasting: function () {
		return this.spells.some(s => s.currentAction);
	},

	stopCasting: function (ignore, skipAuto) {
		this.spells.forEach(s => {
			if (s === ignore)
				return;

			if (!skipAuto)
				s.setAuto(null);

			if (!s.currentAction)
				return;

			s.castTime = 0;
			s.currentAction = null;

			if (!ignore || !ignore.castTimeMax)
				this.obj.syncer.set(false, null, 'casting', 0);
		});
	},

	events: {
		beforeMove: function () {
			this.stopCasting(null, true);
		},

		clearQueue: function () {
			this.stopCasting(null, true);
		},

		beforeDeath: function () {
			this.stopCasting(null, true);

			this.spells.forEach(function (s) {
				if (!s.castOnDeath)
					return;

				s.cast();
			});
		},

		beforeRezone: function () {
			this.spells.forEach(function (s) {
				if (s.active) {
					s.active = false;

					let reserve = s.manaReserve;

					if (reserve && reserve.percentage) {
						let reserveEvent = {
							spell: s.name,
							reservePercent: reserve.percentage
						};
						this.obj.fireEvent('onBeforeReserveMana', reserveEvent);
						this.obj.stats.addStat('manaReservePercent', -reserveEvent.reservePercent);
					}

					//Make sure to remove the buff from party members
					s.updateInactive();
				}
			}, this);

			let callbacks = this.callbacks;
			let cLen = callbacks.length;
			for (let i = 0; i < cLen; i++) {
				let c = callbacks[i];

				//If a spellCallback kills a mob he'll unregister his callbacks
				//Probably not needed since we aren't supposed to damage mobs in destroyCallback
				if (!c) {
					i--;
					cLen--;
					continue;
				}

				if (c.destroyOnRezone) {
					if (c.destroyCallback)
						c.destroyCallback();
					callbacks.splice(i, 1);
					i--;
					cLen--;
				}
			}
		}
	}
};
