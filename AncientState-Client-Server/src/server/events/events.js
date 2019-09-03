let phaseTemplate = require('../config/eventPhases/phaseTemplate');
let fs = require('fs');
let mapList = require('../config/maps/mapList');

module.exports = {
	configs: [],
	nextId: 0,

	init: function (instance) {
		this.instance = instance;

		let zoneName = this.instance.map.name;
		let zonePath = mapList.mapList.find(z => z.name === zoneName).path;
		let path = zonePath + '/' + zoneName + '/events';
		if (!fs.existsSync(path))
			return;

		let files = fs.readdirSync(path)
			.map(f => ('../' + path + '/' + f));

		this.instance.eventEmitter.emit('onBeforeGetEventList', zoneName, files);

		files.forEach(function (f) {
			let e = require(f);
			if (!e.disabled)
				this.configs.push(extend({}, e));
		}, this);
	},

	getEvent: function (name) {
		return this.configs.find(c => (c.name === name)).event.config;
	},
	setEventDescription: function (name, desc) {
		let config = this.getEvent(name);
		let event = config.event;
		if (!event)
			return;

		if (!config.oldDescription)
			config.oldDescription = config.description;

		if ((config.events) && (config.events.beforeSetDescription))
			config.events.beforeSetDescription(this);

		if (desc)
			config.description = desc;

		event.participators.forEach(p => p.events.syncList());
	},
	setEventRewards: function (name, rewards) {
		let config = this.getEvent(name);
		let event = config.event;
		if (!event)
			return;

		event.rewards = rewards;
		event.age = event.config.duration - 2;
	},
	setWinText: function (name, text) {
		let config = this.getEvent(name);
		let event = config.event;
		if (!event)
			return;

		event.winText = text;
	},

	update: function () {
		let configs = this.configs;
		if (!configs)
			return;

		let scheduler = this.instance.scheduler;

		let cLen = configs.length;
		for (let i = 0; i < cLen; i++) {
			let c = configs[i];

			if (c.event) {
				this.updateEvent(c.event);
				if (c.event.done)
					this.stopEvent(c);
				continue;
			} else if ((c.ttl) && (c.ttl > 0)) {
				c.ttl--;
				continue;
			} else if (c.cron) {
				if (c.durationEvent && !scheduler.isActive(c))
					continue;
				else if (!c.durationEvent && !scheduler.shouldRun(c))
					continue;
			}

			c.event = this.startEvent(c);
			this.updateEvent(c.event);
		}
	},

	startEvent: function (config) {
		if (config.oldDescription)
			config.description = config.oldDescription;

		let event = {
			id: this.nextId++,
			config: extend({}, config),
			phases: [],
			participators: [],
			objects: [],
			nextPhase: 0,
			age: 0
		};
		event.config.event = event;

		return event;
	},

	giveRewards: function (config) {
		let event = config.event;

		config.event.participators.forEach(function (p) {
			let rList = [{
				nameLike: 'Ancient Carp',
				removeAll: true
			}];

			let rewards = event.rewards;
			if ((rewards) && (rewards[p.name])) {
				rewards[p.name].forEach(r => rList.push(r));
				if (rList.length > 1)
					rList[1].msg = 'Fishing tournament reward:';
			}

			this.instance.mail.sendMail(p.name, rList);
		}, this);

		if ((config.events) && (config.events.afterGiveRewards))
			config.events.afterGiveRewards(this);
	},

	stopEvent: function (config) {
		let event = config.event;

		config.event.participators.forEach(function (p) {
			p.events.unregisterEvent(event);
		}, this);

		config.event.objects.forEach(function (o) {
			o.destroyed = true;

			this.instance.syncer.queue('onGetObject', {
				x: o.x,
				y: o.y,
				components: [{
					type: 'attackAnimation',
					row: 0,
					col: 4
				}]
			}, -1);
		}, this);

		if (event.winText) {
			this.instance.syncer.queue('serverModule', {
				module: 'cons',
				method: 'emit',
				msg: [
					'event',
					{
						event: 'onGetMessages',
						data: {
							messages: {
								class: 'color-pinkA',
								message: event.winText
							}
						}
					}
				]
			}, 'server');
		}

		event.phases.forEach(function (p) {
			if ((p.destroy) && (!p.destroyed)) {
				p.destroyed = true;
				p.destroy();
			}
		});

		delete config.event;
	},

	updateEvent: function (event) {
		const onTick = _.getDeepProperty(event, ['config', 'events', 'onTick']);
		if (onTick)
			onTick(this, event);

		let objects = event.objects;
		let oLen = objects.length;
		for (let i = 0; i < oLen; i++) {
			if (objects[i].destroyed) {
				objects.splice(i, 1);
				i--;
				oLen--;
			}
		}

		let currentPhases = event.phases;
		let cLen = currentPhases.length;
		let stillBusy = false;
		for (let i = 0; i < cLen; i++) {
			let phase = currentPhases[i];
			if (!phase.destroyed) {
				if (phase.end || (phase.endMark !== -1 && phase.endMark <= event.age)) {
					if ((phase.destroy) && (!phase.destroyed))
						phase.destroy();
					phase.destroyed = true;
					continue;
				} else {
					if (!phase.auto)
						stillBusy = true;

					phase.update();
				}
			}
		}

		if (event.config.notifications) {
			let n = event.config.notifications.find(f => (f.mark === event.age));
			if (n) {
				this.instance.syncer.queue('serverModule', {
					module: 'cons',
					method: 'emit',
					msg: [
						'event',
						{
							event: 'onGetMessages',
							data: {
								messages: {
									class: 'color-pinkA',
									message: n.msg
								}
							}
						}
					]
				}, 'server');

				if (n.has('desc')) {
					event.config.descTimer = n.desc;
					this.setEventDescription(event.config.name);
				}

				if (n.event && event.config.events[n.event])
					event.config.events[n.event](this, event);
			}
		}

		event.age++;

		if (event.age === event.config.duration) 
			event.done = true;
		
		else if ((event.config.prizeTime) && (event.age === event.config.prizeTime)) 
			this.giveRewards(event.config);

		if (stillBusy)
			return;

		let config = event.config;

		let phases = config.phases;
		let pLen = phases.length;
		for (let i = event.nextPhase; i < pLen; i++) {
			let p = phases[i];

			let phaseFile = 'phase' + p.type[0].toUpperCase() + p.type.substr(1);
			let typeTemplate = require('../config/eventPhases/' + phaseFile);
			let phase = extend({
				instance: this.instance,
				event: event
			}, phaseTemplate, typeTemplate, p);

			event.phases.push(phase);

			phase.init();

			event.nextPhase = i + 1;

			if (!p.auto) {
				stillBusy = true;
				break;
			}
		}

		if ((event.nextPhase >= pLen) && (!stillBusy))
			event.done = true;

		let oList = this.instance.objects.objects;
		oLen = oList.length;
		for (let i = 0; i < oLen; i++) {
			let o = oList[i];
			if (!o.player)
				continue;

			o.events.events.afterMove.call(o.events);
		}
	},

	getCloseEvents: function (obj) {
		let x = obj.x;
		let y = obj.y;

		let configs = this.configs;
		if (!configs)
			return;

		let cLen = configs.length;
		let result = [];
		for (let i = 0; i < cLen; i++) {
			let event = configs[i].event;
			if (!event)
				continue;

			let exists = event.participators.find(p => (p.name === obj.name));
			if (exists) {
				event.participators.spliceWhere(p => (p === exists));
				event.participators.push(obj);
				result.push(event);
				continue;
			}

			let distance = event.config.distance;
			if (distance === -1) {
				event.participators.push(obj);
				result.push(event);

				let rList = [{
					nameLike: 'Ancient Carp',
					removeAll: true
				}];

				this.instance.mail.sendMail(obj.name, rList);

				continue;
			}

			let objects = event.objects;
			let oLen = objects.length;
			for (let j = 0; j < oLen; j++) {
				let o = objects[j];

				if (
					(distance === -1) ||
					(!distance) ||
					(
						(Math.abs(x - o.x) < distance) &&
						(Math.abs(y - o.y) < distance)
					)
				) {
					event.participators.push(obj);
					result.push(event);

					let rList = [{
						nameLike: 'Ancient Carp',
						removeAll: true
					}];

					this.instance.mail.sendMail(obj.name, rList);

					break;
				}
			}
		}

		return result;
	}
};
