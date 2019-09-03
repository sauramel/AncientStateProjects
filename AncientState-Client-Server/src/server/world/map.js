let objects = require('../objects/objects');
let physics = require('./physics');
let spawners = require('./spawners');
let resourceSpawner = require('./resourceSpawner');
let globalZone = require('../config/zoneBase');
let randomMap = require('./randomMap');
let events = require('../misc/events');

const mapObjects = require('./map/mapObjects');

let mapFile = null;
let mapScale = null;
let padding = null;

const objectifyProperties = oldProperties => {
	if (!oldProperties || !oldProperties.push)
		return oldProperties || {};

	let newProperties = {};
	oldProperties.forEach(p => {
		newProperties[p.name] = p.value;
	});
			
	return newProperties;
};

module.exports = {
	name: null,
	path: null,
	layers: [],

	mapFile: null,

	size: {
		w: 0,
		h: 0
	},

	custom: null,

	collisionMap: null,

	clientMap: null,
	oldLayers: {
		tiles: null,
		walls: null,
		doodads: null
	},

	objBlueprints: [],

	spawn: {
		x: 0,
		y: 0
	},

	rooms: [],
	hiddenRooms: [],

	hiddenWalls: null,
	hiddenTiles: null,

	zone: null,

	init: function (args) {
		this.name = args.name;
		this.path = args.path;
		
		try {
			this.zone = require('../' + this.path + '/' + this.name + '/zone');
		} catch (e) {
			this.zone = globalZone;
		}
		events.emit('onAfterGetZone', this.name, this.zone);

		let chats = null;
		try {
			chats = require('../' + this.path + '/' + this.name + '/chats');
		} catch (e) {}
		if (chats)
			this.zone.chats = chats;

		let dialogues = null;
		try {
			dialogues = require('../' + this.path + '/' + this.name + '/dialogues');
		} catch (e) {}
		events.emit('onBeforeGetDialogue', this.name, dialogues);
		if (dialogues)
			this.zone.dialogues = dialogues;

		this.zone = extend({}, globalZone, this.zone);

		let resources = this.zone.resources || {};
		for (let r in resources)
			resourceSpawner.register(r, resources[r]);

		mapFile = require('../' + this.path + '/' + this.name + '/map');
		this.mapFile = mapFile;
		//Fix for newer versions of Tiled
		this.mapFile.properties = objectifyProperties(this.mapFile.properties);

		mapScale = mapFile.tilesets[0].tileheight;

		this.custom = mapFile.properties.custom;

		if (mapFile.properties.spawn) {
			this.spawn = JSON.parse(mapFile.properties.spawn);
			if (!this.spawn.push)
				this.spawn = [this.spawn];
		}
	},
	create: function () {
		this.getMapFile();

		this.clientMap = {
			zoneId: -1,
			map: this.layers,
			hiddenWalls: this.hiddenWalls,
			hiddenTiles: this.hiddenTiles,
			collisionMap: this.collisionMap,
			clientObjects: this.objBlueprints,
			padding: padding,
			hiddenRooms: this.hiddenRooms
		};
	},
	getMapFile: function () {
		this.build();

		randomMap = extend({}, randomMap);
		this.oldMap = this.layers;
		randomMap.templates = extend([], this.rooms);
		randomMap.generateMappings(this);

		for (let i = 0; i < this.size.w; i++) {
			let row = this.layers[i];
			for (let j = 0; j < this.size.h; j++) {
				let cell = row[j];
				if (!cell)
					continue;

				cell = cell.split(',');
				let cLen = cell.length;

				let newCell = '';
				for (let k = 0; k < cLen; k++) {
					let c = cell[k];
					let newC = randomMap.randomizeTile(c);
					newCell += newC;

					//Wall?
					if ((c >= 160) && (c <= 352) && (newC === 0))
						this.collisionMap[i][j] = 0;

					if (k < cLen - 1)
						newCell += ',';
				}

				if (this.hiddenWalls[i][j])
					this.hiddenWalls[i][j] = randomMap.randomizeTile(this.hiddenWalls[i][j]);
				if (this.hiddenTiles[i][j])
					this.hiddenTiles[i][j] = randomMap.randomizeTile(this.hiddenTiles[i][j]);

				row[j] = newCell;
			}
		}

		//Fix for newer versions of Tiled
		randomMap.templates
			.forEach(r => {
				r.properties = objectifyProperties(r.properties); 
			});

		randomMap.templates
			.filter(r => r.properties.mapping)
			.forEach(function (m) {
				let x = m.x;
				let y = m.y;
				let w = m.width;
				let h = m.height;

				for (let i = x; i < x + w; i++) {
					let row = this.layers[i];

					for (let j = y; j < y + h; j++)
						row[j] = '';
				}
			}, this);

		physics.init(this.collisionMap);

		padding = mapFile.properties.padding;

		mapFile = null;

		_.log('(M ' + this.name + '): Ready');
	},

	build: function () {
		this.size.w = mapFile.width;
		this.size.h = mapFile.height;

		this.layers = _.get2dArray(this.size.w, this.size.h, null);
		this.hiddenWalls = _.get2dArray(this.size.w, this.size.h, null);
		this.hiddenTiles = _.get2dArray(this.size.w, this.size.h, null);

		this.oldLayers.tiles = _.get2dArray(this.size.w, this.size.h, 0);
		this.oldLayers.walls = _.get2dArray(this.size.w, this.size.h, 0);
		this.oldLayers.objects = _.get2dArray(this.size.w, this.size.h, 0);

		let builders = {
			tile: this.builders.tile.bind(this),
			object: this.builders.object.bind(this)
		};

		this.collisionMap = _.get2dArray(this.size.w, this.size.h);

		//Rooms need to be ahead of exits
		mapFile.layers.rooms = (mapFile.layers.rooms || [])
			.sort(function (a, b) {
				if ((a.exit) && (!b.exit))
					return 1;
				return 0;
			});

		for (let i = 0; i < mapFile.layers.length; i++) {
			let layer = mapFile.layers[i];
			let layerName = layer.name;
			if (!layer.visible)
				continue;

			let data = layer.data || layer.objects;
			let firstItem = data[0];
			if (firstItem && firstItem.has('width')) {
				let info = {
					map: this.name,
					layer: layerName,
					objects: data
				};
				events.emit('onAfterGetLayerObjects', info);
			}

			let len = data.length;
			for (let j = 0; j < len; j++) {
				let cell = data[j];

				if ((cell.gid) || (cell.id))
					builders.object(layerName, cell, j);
				else {
					let y = ~~(j / this.size.w);
					let x = j - (y * this.size.w);

					let info = {
						map: this.name,
						layer: layerName,
						cell: cell,
						x: x,
						y: y
					};
					events.emit('onBeforeBuildLayerTile', info);
					builders.tile(layerName, info.cell, j);
				}
			}
		}
	},
	builders: {
		getCellInfo: function (cell) {
			let flipX = null;

			if ((cell ^ 0x80000000) > 0) {
				flipX = true;
				cell = cell ^ 0x80000000;
			}

			let firstGid = 0;
			let sheetName = null;
			for (let s = 0; s < mapFile.tilesets.length; s++) {
				let tileset = mapFile.tilesets[s];
				if (tileset.firstgid <= cell) {
					sheetName = tileset.name;
					firstGid = tileset.firstgid;
				}
			}

			cell = cell - firstGid + 1;

			return {
				sheetName: sheetName,
				cell: cell,
				flipX: flipX
			};
		},
		tile: function (layerName, cell, i) {
			let y = ~~(i / this.size.w);
			let x = i - (y * this.size.w);

			if (cell === 0) {
				if (layerName === 'tiles')
					this.collisionMap[x][y] = 1;

				return;
			}

			let cellInfo = this.builders.getCellInfo(cell);
			let sheetName = cellInfo.sheetName;
			cell = cellInfo.cell;
			if (sheetName === 'walls')
				cell += 192;
			else if (sheetName === 'objects')
				cell += 448;

			if ((layerName !== 'hiddenWalls') && (layerName !== 'hiddenTiles')) {
				let layer = this.layers;
				if (this.oldLayers[layerName])
					this.oldLayers[layerName][x][y] = cell;
				layer[x][y] = (layer[x][y] === null) ? cell : layer[x][y] + ',' + cell;
			} else if (layerName === 'hiddenWalls')
				this.hiddenWalls[x][y] = cell;
			else if (layerName === 'hiddenTiles')
				this.hiddenTiles[x][y] = cell;

			if (layerName.indexOf('walls') > -1)
				this.collisionMap[x][y] = 1;
			else if (sheetName.toLowerCase().indexOf('tiles') > -1) {
				//Check for water and water-like tiles
				if ([6, 7, 54, 55, 62, 63, 154, 189, 190].indexOf(cell) > -1)
					this.collisionMap[x][y] = 1;
			}
		},
		object: function (layerName, cell) {
			//Fix for newer versions of tiled
			cell.properties = objectifyProperties(cell.properties);

			let clientObj = (layerName === 'clientObjects');
			let cellInfo = this.builders.getCellInfo(cell.gid);

			let name = (cell.name || '');
			let objZoneName = name;
			if (name.indexOf('|') > -1) {
				let split = name.split('|');
				name = split[0];
				objZoneName = split[1];
			}

			let blueprint = {
				clientObj: clientObj,
				sheetName: cellInfo.sheetName,
				cell: cellInfo.cell - 1,
				x: cell.x / mapScale,
				y: (cell.y / mapScale) - 1,
				name: name,
				properties: cell.properties || {},
				layerName: layerName
			};

			if (objZoneName !== name)
				blueprint.objZoneName = objZoneName;

			if (this.zone) {
				if ((this.zone.objects) && (this.zone.objects[objZoneName.toLowerCase()]))
					extend(blueprint, this.zone.objects[objZoneName.toLowerCase()]);
				else if ((this.zone.objects) && (this.zone.mobs[objZoneName.toLowerCase()]))
					extend(blueprint, this.zone.mobs[objZoneName.toLowerCase()]);
			}

			if (blueprint.blocking)
				this.collisionMap[blueprint.x][blueprint.y] = 1;

			if ((blueprint.properties.cpnNotice) || (blueprint.properties.cpnLightPatch) || (layerName === 'rooms') || (layerName === 'hiddenRooms')) {
				blueprint.y++;
				blueprint.width = cell.width / mapScale;
				blueprint.height = cell.height / mapScale;
			} else if (cell.width === 24)
				blueprint.x++;

			if (cell.polyline) 
				mapObjects.polyline(this.size, blueprint, cell, mapScale);

			if (layerName === 'rooms') {
				if (blueprint.properties.exit) {
					let room = this.rooms.find(function (r) {
						return (!(
							(blueprint.x + blueprint.width < r.x) ||
								(blueprint.y + blueprint.height < r.y) ||
								(blueprint.x >= r.x + r.width) ||
								(blueprint.y >= r.y + r.height)
						));
					});

					room.exits.push(blueprint);
				} else if (blueprint.properties.resource)
					resourceSpawner.register(blueprint.properties.resource, blueprint);
				else {
					blueprint.exits = [];
					blueprint.objects = [];
					this.rooms.push(blueprint);
				}
			} else if (layerName === 'hiddenRooms') {
				blueprint.fog = (cell.properties || {}).fog;
				blueprint.discoverable = (cell.properties || {}).discoverable;
				this.hiddenRooms.push(blueprint);
			} else if (!clientObj) {
				if (!mapFile.properties.isRandom)
					spawners.register(blueprint, blueprint.spawnCd || mapFile.properties.spawnCd);
				else {
					let room = this.rooms.find(function (r) {
						return (!(
							(blueprint.x < r.x) ||
								(blueprint.y < r.y) ||
								(blueprint.x >= r.x + r.width) ||
								(blueprint.y >= r.y + r.height)
						));
					});
					room.objects.push(blueprint);
				}
			} else {
				if ((cell.width) && (!cell.polyline)) {
					blueprint.width = cell.width / mapScale;
					blueprint.height = cell.height / mapScale;
				}

				let obj = objects.buildObjects([blueprint], true).getSimple(true);
				this.objBlueprints.push(obj);
			}
		}
	},

	getSpawnPos: function (obj) {
		let stats = obj.components.find(c => (c.type === 'stats'));
		let level = stats.values.level;

		let spawns = this.spawn.filter(s => (((s.maxLevel) && (s.maxLevel >= level)) || (!s.maxLevel)));
		return spawns[0];
	}
};
