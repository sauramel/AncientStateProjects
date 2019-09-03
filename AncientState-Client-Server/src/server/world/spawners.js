let mobBuilder = require('./mobBuilder');
let animations = require('../config/animations');
let scheduler = require('../misc/scheduler');

module.exports = {
	list: [],
	mobTypes: {},

	init: function (msg) {
		this.objects = msg.objects;
		this.syncer = msg.syncer;
		this.zone = msg.zone;
		this.mobBuilder = extend({
			zone: this.zone
		}, mobBuilder);
	},

	reset: function () {
		this.list = [];
		this.mobTypes = {};
	},

	register: function (blueprint, cdMax) {
		let spawner = extend({
			cdMax: cdMax || 171,
			cron: blueprint.cron,
			lifetime: blueprint.lifetime,
			blueprint: blueprint,
			amountLeft: blueprint.amount || -1
		});

		this.list.push(spawner);

		if (blueprint.layerName !== 'mobs')
			return;

		let name = blueprint.name.toLowerCase();
		if (!this.mobTypes[name])
			this.mobTypes[name] = 1;
		else
			this.mobTypes[name]++;

		spawner.zonePrint = extend({}, this.zone.mobs.default, this.zone.mobs[name] || {});
	},

	spawn: function (spawner) {
		if (spawner.amountLeft === 0)
			return;

		let blueprint = spawner.blueprint;
		let obj = this.objects.buildObjects([blueprint]);

		let customSpawn = false;

		let sheetName = blueprint.sheetName;
		if ((sheetName) && (blueprint.sheetName.indexOf('/'))) {
			let spawnAnimation = _.getDeepProperty(animations, ['mobs', sheetName, blueprint.cell, 'spawn']);
			if (spawnAnimation) {
				customSpawn = true;

				this.syncer.queue('onGetObject', {
					id: obj.id,
					performLast: true,
					components: [spawnAnimation]
				}, -1);
			}
		}

		if (!customSpawn) {
			this.syncer.queue('onGetObject', {
				x: obj.x,
				y: obj.y,
				components: [{
					type: 'attackAnimation',
					row: 0,
					col: 4
				}]
			}, -1);
		}

		if (spawner.amountLeft !== -1)
			spawner.amountLeft--;

		return obj;
	},

	update: function () {
		let list = this.list;
		let lLen = list.length;

		for (let i = 0; i < lLen; i++) {
			let l = list[i];

			if ((l.lifetime) && (l.mob)) {
				if (l.mob.destroyed) {
					delete l.age;
					delete l.mob;
				} else {
					if (!l.age)
						l.age = 1;
					else
						l.age++;

					if (l.age >= l.lifetime) {
						this.syncer.queue('onGetObject', {
							x: l.mob.x,
							y: l.mob.y,
							components: [{
								type: 'attackAnimation',
								row: 0,
								col: 4
							}]
						}, -1);

						l.mob.destroyed = true;
						delete l.age;
						delete l.mob;
					}
				}
			}

			if (!l.cron) {
				if (l.cd > 0) 
					l.cd--;
				else if ((l.mob) && (l.mob.destroyed))
					l.cd = l.cdMax;
			}

			let cronInfo = {
				cron: l.cron,
				lastRun: l.lastRun
			};

			let doSpawn = (
				(
					(!l.cron) &&
					(!l.mob)
				) ||
				(
					(!l.cron) &&
					(l.cd === 0)
				) ||
				(
					(!l.mob) &&
					(l.cron) &&
					(scheduler.shouldRun(cronInfo))
				)
			);

			if (doSpawn) {
				if (!l.cron)
					l.cd = -1;
				else
					l.lastRun = cronInfo.lastRun;

				let mob = this.spawn(l);
				if (!mob)
					continue;

				let name = (l.blueprint.objZoneName || l.blueprint.name).toLowerCase();

				if (l.blueprint.layerName === 'mobs') 
					this.setupMob(mob, l.zonePrint);
				else {
					let blueprint = extend({}, this.zone.objects.default, this.zone.objects[name] || {});
					this.setupObj(mob, blueprint);
				}

				if (l.blueprint.objZoneName)
					mob.objZoneName = l.blueprint.objZoneName;

				l.mob = mob;
			}
		}
	},

	setupMob: function (mob, blueprint) {
		let type = 'regular';
		if (blueprint.isChampion)
			type = 'champion';
		else if (blueprint.rare.count > 0) {
			let rareCount = this.list.filter(l => (
				(l.mob) &&
				(!l.mob.destroyed) &&
				(l.mob.isRare) &&
				(l.mob.baseName === mob.name)
			));
			if (rareCount.length < blueprint.rare.count) {
				let roll = Math.random() * 100;
				if (roll < blueprint.rare.chance)
					type = 'rare';
			}
		}

		this.setupObj(mob, blueprint);

		this.mobBuilder.build(mob, blueprint, type, this.zone.name);
	},

	setupObj: function (obj, blueprint) {
		let cpns = blueprint.components;
		if (!cpns)
			return;

		for (let c in cpns) {
			let cpn = cpns[c];

			let cType = c.replace('cpn', '');
			cType = cType[0].toLowerCase() + cType.substr(1);

			let builtCpn = obj.addComponent(cType, cpn);

			if (cpn.simplify)
				builtCpn.simplify = cpn.simplify.bind(builtCpn);
		}
	}
};
