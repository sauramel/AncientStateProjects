let map = require('./map');
let syncer = require('./syncer');
let objects = require('../objects/objects');
let spawners = require('./spawners');
let physics = require('./physics');
let resourceSpawner = require('./resourceSpawner');
let spellCallbacks = require('../config/spells/spellCallbacks');
let questBuilder = require('../config/quests/questBuilder');
let randomMap = require('./randomMap');
let events = require('../events/events');
let scheduler = require('../misc/scheduler');
let mail = require('../mail/mail');
let herbs = require('../config/herbs');
let eventEmitter = require('../misc/events');

module.exports = {
	instances: [],
	zoneId: -1,
	speed: consts.tickTime,

	lastTime: 0,

	init: function (args) {
		this.zoneId = args.zoneId;

		spellCallbacks.init();
		herbs.init();
		map.init(args);

		let fakeInstance = {
			objects: objects,
			syncer: syncer,
			physics: physics,
			zoneId: this.zoneId,
			spawners: spawners,
			questBuilder: questBuilder,
			events: events,
			zone: map.zone,
			mail: mail,
			map: map,
			scheduler: scheduler,
			eventEmitter: eventEmitter
		};

		this.instances.push(fakeInstance);

		spawners.init(fakeInstance);
		scheduler.init();

		map.create();
		if (map.mapFile.properties.isRandom) {
			if (!map.oldCollisionMap)
				map.oldCollisionMap = map.collisionMap;

			randomMap.generate({
				map: map,
				physics: physics,
				spawners: spawners
			});

			map.seed = _.getGuid();
		}

		map.clientMap.zoneId = this.zoneId;

		[resourceSpawner, syncer, objects, questBuilder, events, mail].forEach(i => i.init(fakeInstance));

		this.tick();
	},

	tick: function () {
		events.update();
		objects.update();
		resourceSpawner.update();
		spawners.update();
		syncer.update();
		scheduler.update();

		setTimeout(this.tick.bind(this), this.speed);
	},

	addObject: function (msg) {
		let obj = msg.obj;
		obj.serverId = obj.id;
		delete obj.id;

		let spawnPos = map.getSpawnPos(obj);
		let spawnEvent = {
			spawnPos: extend({}, spawnPos),
			changed: false
		};
		eventEmitter.emitNoSticky('onBeforePlayerSpawn', { name: obj.name, instance: { physics } }, spawnEvent);
		if (spawnEvent.changed)
			msg.keepPos = false;

		if ((msg.keepPos) && (!physics.isValid(obj.x, obj.y)))
			msg.keepPos = false;

		if (!msg.keepPos || !obj.has('x') || (map.mapFile.properties.isRandom && obj.instanceId !== map.seed)) {
			obj.x = spawnPos.x;
			obj.y = spawnPos.y;
		}

		obj.instanceId = map.seed || null;

		obj.spawn = map.spawn;

		syncer.queue('onGetMap', map.clientMap, [obj.serverId]);

		if (!msg.transfer)
			objects.addObject(obj, this.onAddObject.bind(this));
		else {
			let o = objects.transferObject(obj);
			questBuilder.obtain(o);
		}
	},

	onAddObject: function (obj) {
		if (obj.player)
			obj.stats.onLogin();

		questBuilder.obtain(obj);
		obj.fireEvent('afterMove');

		if (obj.dead) {
			obj.instance.syncer.queue('onDeath', {
				x: obj.x,
				y: obj.y
			}, [obj.serverId]);
		}
	},

	updateObject: function (msg) {
		let obj = objects.find(o => o.serverId === msg.id);
		if (!obj)
			return;

		let msgObj = msg.obj;

		let components = msgObj.components || [];
		delete msgObj.components;

		for (let p in msgObj) 
			obj[p] = msgObj[p];

		let cLen = components.length;
		for (let i = 0; i < cLen; i++) {
			let c = components[i];
			let component = obj[c.type];
			for (let p in c) 
				component[p] = c[p];
		}
	},

	queueAction: function (msg) {
		let obj = objects.find(o => o.serverId === msg.id);
		if (!obj)
			return;
		else if (msg.action.action === 'move') {
			let moveEntries = obj.actionQueue.filter(q => (q.action === 'move')).length;
			if (moveEntries >= 50)
				return;
		}

		obj.queue(msg.action);
	},

	performAction: function (msg) {
		let obj = null;
		let targetId = msg.action.targetId;
		if (!targetId)
			obj = objects.find(o => o.serverId === msg.id);
		else {
			obj = objects.find(o => o.id === targetId);
			if (obj) {
				let action = msg.action;
				if (!action.data)
					action.data = {};
				action.data.sourceId = msg.id;
			}
		}

		if (!obj)
			return;

		obj.performAction(msg.action);
	},

	removeObject: async function (msg) {
		let obj = msg.obj;
		obj = objects.find(o => o.serverId === obj.id);
		if (!obj) {
			//We should probably never reach this
			return;
		}

		if (obj.auth)
			await obj.auth.doSave();

		if (obj.player)
			obj.fireEvent('beforeRezone');

		obj.destroyed = true;

		if (msg.callbackId) {
			process.send({
				module: 'atlas',
				method: 'resolveCallback',
				msg: {
					id: msg.callbackId
				}
			});
		}
	}
};
