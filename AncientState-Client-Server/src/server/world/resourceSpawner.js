let herbs = require('../config/herbs');

module.exports = {
	nodes: [],

	objects: null,
	syncer: null,
	zone: null,
	physics: null,
	map: null,

	cdMax: 171,

	init: function (instance) {
		Object.assign(this, {
			objects: instance.objects,
			syncer: instance.syncer,
			physics: instance.physics,
			map: instance.map,
			zone: instance.zone
		});
	},

	register: function (name, blueprint) {
		let exists = this.nodes.find(n => (n.blueprint.name === name));
		if (exists) {
			if (!exists.blueprint.positions) {
				exists.blueprint.positions = [{
					x: exists.blueprint.x,
					y: exists.blueprint.y,
					width: exists.blueprint.width,
					height: exists.blueprint.height
				}];
			}

			exists.blueprint.positions.push({
				x: blueprint.x,
				y: blueprint.y,
				width: blueprint.width,
				height: blueprint.height
			});

			return;
		}

		blueprint = extend({}, blueprint, herbs[name], {
			name: name
		});

		let max = blueprint.max;
		delete blueprint.max;

		let chance = blueprint.chance;
		delete blueprint.chance;

		let cdMax = blueprint.cdMax;
		delete blueprint.cdMax;

		this.nodes.push({
			cd: 0,
			max: max,
			chance: chance,
			cdMax: cdMax,
			blueprint: blueprint,
			spawns: []
		});
	},

	getRandomSpawnPosition: function (node, blueprint) {
		//Get an accessible position
		let w = this.physics.width;
		let h = this.physics.height;

		let x = blueprint.x;
		let y = blueprint.y;

		let position = null;

		if (blueprint.type === 'herb') {
			x = ~~(Math.random() * w);
			y = ~~(Math.random() * h);

			if (this.physics.isTileBlocking(x, y))
				return false;

			let spawn = this.map.spawn[0];

			let path = this.physics.getPath(spawn, {
				x: x,
				y: y
			});

			let endTile = path[path.length - 1];
			if (!endTile)
				return false;
			else if ((endTile.x !== x) || (endTile.y !== y))
				return false;
			
			//Don't spawn in rooms or on objects/other resources
			let cell = this.physics.getCell(x, y);
			if (cell.length > 0)
				return false;
				
			position = { x, y };
		} else if (blueprint.positions) {
			//Find all possible positions in which a node hasn't spawned yet
			position = blueprint.positions.filter(f => !node.spawns.some(s => ((s.x === f.x) && (s.y === f.y))));
			if (position.length === 0)
				return false;

			position = position[~~(Math.random() * position.length)];
		}

		return position;
	},

	spawn: function (node) {
		let blueprint = node.blueprint;
		let position = this.getRandomSpawnPosition(node, blueprint);
		if (!position)
			return false;

		let quantity = 1;
		if (blueprint.quantity)
			quantity = blueprint.quantity[0] + ~~(Math.random() * (blueprint.quantity[1] - blueprint.quantity[0]));

		let zoneLevel = this.zone.level;
		zoneLevel = ~~(zoneLevel[0] + ((zoneLevel[1] - zoneLevel[0]) / 2));

		let objBlueprint = extend({}, blueprint, position);
		objBlueprint.properties = {
			cpnResourceNode: {
				nodeType: blueprint.type,
				ttl: blueprint.ttl,
				xp: zoneLevel * zoneLevel,
				blueprint: extend({}, blueprint),
				quantity: quantity
			}
		};

		let obj = this.objects.buildObjects([objBlueprint]);
		delete obj.ttl;

		if (blueprint.type === 'herb') {
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

		let inventory = obj.addComponent('inventory');
		obj.layerName = 'objects';

		node.spawns.push(obj);

		let item = {
			material: true,
			type: node.type || null,
			sprite: node.blueprint.itemSprite,
			name: node.blueprint.name,
			quantity: (blueprint.type !== 'fish') ? 1 : null,
			quality: 0
		};

		if (blueprint.itemSheet)
			item.spritesheet = blueprint.itemSheet;

		if (blueprint.type === 'fish')
			item.noStack = true;

		inventory.getItem(item);

		return true;
	},

	update: function () {
		let nodes = this.nodes;
		let nLen = nodes.length;

		for (let i = 0; i < nLen; i++) {
			let node = nodes[i];

			let spawns = node.spawns;
			spawns.spliceWhere(f => f.destroyed);

			if (spawns.length < node.max) {
				if (node.cd > 0)
					node.cd--;
				else if ((!node.chance || Math.random() < node.chance) && this.spawn(node)) 
					node.cd = node.cdMax || this.cdMax;
			}
		}
	}
};
