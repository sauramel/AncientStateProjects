define([
	'js/constants',
	'js/events'
], function (
	constants,
	events
) {
	return {
		canvas: null,
		ctx: null,

		areaSelectOrigin: null,
		panOrigin: null,

		currentZoom: 1,

		screen: {
			w: 0,
			h: 0
		},

		pos: {
			x: 0,
			y: 0
		},

		oldPos: null,

		mouse: {
			x: 0,
			y: 0
		},

		dirty: true,

		init: function () {
			this.canvas = $('.canvas')[0];
			this.screen.w = this.canvas.width = $('body').width();
			this.screen.h = this.canvas.height = $('body').height();
			this.ctx = this.canvas.getContext('2d');

			this.ctx.lineWidth = constants.lineWidth;

			$(this.canvas)
				.on('contextmenu', function () {
					return false;
				});

			events.on('onMouseMove', this.events.onMouseMove.bind(this));
			events.on('onStartAreaSelect', this.events.onStartAreaSelect.bind(this));
			events.on('onEndAreaSelect', this.events.onEndAreaSelect.bind(this));
			events.on('onSelectGroup', this.events.onSelectGroup.bind(this));
		},

		center: function (node) {
			if (!node)
				return;

			this.pos.x = ~~(node.pos.x * constants.gridSize) + (constants.blockSize / 2) - (this.screen.w / 2);
			this.pos.y = ~~(node.pos.y * constants.gridSize) + (constants.blockSize / 2) - (this.screen.h / 2);

			this.makeDirty();
		},

		pan: function (e, event) {
			var action = ({
				down: 'onPanStart',
				up: 'onPanEnd',
				move: 'onPan'
			})[event];

			this.events[action].call(this, e);
		},

		makeDirty: function () {
			this.dirty = true;
		},

		renderNodes: function (nodes, links) {
			links.forEach(function (l) {
				var linked = (
					nodes.find(n => (n == l.from)).selected &&
					nodes.find(n => (n == l.to)).selected
				);
				this.renderers.line.call(this, l.from, l.to, linked);
			}, this);

			nodes.forEach(function (n) {
				this.renderers.node.call(this, n, n.pos.x, n.pos.y);
			}, this);
		},

		render: function (nodes, links) {
			this.dirty = false;

			this.renderers.clear.call(this);
			this.renderers.grid.call(this);

			this.renderNodes(nodes, links);

			if (this.areaSelectOrigin)
				this.renderers.selectArea.call(this);
		},

		zoom: function (delta, zoom) {
			delta = delta ? -1 : 1;

			this.renderers.clear.call(this);
			this.ctx.restore();

			var newZoom = zoom || (this.currentZoom + (delta * 0.2));
			this.currentZoom = newZoom;
			if (this.currentZoom < 0.4)
				this.currentZoom = 0.4;
			else if (this.currentZoom > 3)
				this.currentZoom = 3;

			this.screen.w = $('body').width() / this.currentZoom;
			this.screen.h = $('body').height() / this.currentZoom;

			this.ctx.save();
			this.ctx.scale(this.currentZoom, this.currentZoom);
		},

		renderers: {
			clear: function () {
				var pos = this.oldPos || this.pos;

				this.ctx.clearRect(0, 0, this.screen.w, this.screen.h);

				delete this.oldPos;
			},

			selectArea: function () {
				var ctx = this.ctx;
				var area = this.areaSelectOrigin;
				var mouse = this.mouse;

				ctx.fillStyle = '#51fc9a';
				ctx.globalAlpha = 0.1;

				var lowX = (Math.min(area.x, mouse.x) * constants.gridSize) - this.pos.x;
				var lowY = (Math.min(area.y, mouse.y) * constants.gridSize) - this.pos.y;

				var highX = (Math.max(area.x, mouse.x) * constants.gridSize) - this.pos.x;
				var highY = (Math.max(area.y, mouse.y) * constants.gridSize) - this.pos.y;

				ctx.fillRect(lowX, lowY, highX - lowX, highY - lowY);

				ctx.globalAlpha = 1;
			},

			grid: function () {
				var gridSize = constants.gridSize;
				var ctx = this.ctx;
				var mouse = this.mouse;

				var gapSize = (constants.blockSize - 4) / 2;

				var x = ~~(this.pos.x / gridSize) - (this.pos.x / gridSize);
				var y = ~~(this.pos.y / gridSize) - (this.pos.y / gridSize);

				w = ~~(this.screen.w / gridSize);
				h = ~~(this.screen.h / gridSize);

				ctx.fillStyle = '#3c3f4c';
				for (var i = x; i < w; i++) {
					for (var j = y; j < h; j++) {
						ctx.fillRect((i * gridSize) + gapSize, (j * gridSize) + gapSize, 4, 4);
					}
				}

				ctx.strokeStyle = '#44cb95';
				ctx.strokeRect(
					(this.mouse.x * constants.gridSize) - this.pos.x + (gapSize / 1),
					(this.mouse.y * constants.gridSize) - this.pos.y + (gapSize / 1),
					8,
					8
				);
			},

			node: function (node) {
				var color = (node.color >= 0) ? (node.color + 1) : -1;
				if ((!node.stats) || (Object.keys(node.stats).length == 0))
					color = 0;

				this.ctx.fillStyle = ([
					'#69696e',
					'#c0c3cf',
					'#3fa7dd',
					'#4ac441',
					'#d43346',
					'#a24eff',
					'#faac45',
					'#44cb95'
				])[color];
				var size = ([
					constants.blockSize,
					constants.blockSize * 2,
					constants.blockSize * 3
				])[node.size];
				var x = (node.pos.x * constants.gridSize) - ((size - constants.blockSize) / 2) - this.pos.x;
				var y = (node.pos.y * constants.gridSize) - ((size - constants.blockSize) / 2) - this.pos.y;

				this.ctx.fillRect(x, y, size, size);

				this.ctx.strokeStyle = ([
					'#69696e',
					'#69696e',
					'#42548d',
					'#386646',
					'#763b3b',
					'#533399',
					'#d07840',
					'#3f8d6d'
				])[color];
				this.ctx.strokeRect(x, y, size, size);

				if (node.selected) {
					this.ctx.strokeStyle = '#fafcfc';
					this.ctx.strokeRect(x, y, size, size);
				}
			},

			line: function (fromNode, toNode, linked) {
				var ctx = this.ctx;
				var halfSize = constants.blockSize / 2;

				var fromX = (fromNode.pos.x * constants.gridSize) + halfSize - this.pos.x;
				var fromY = (fromNode.pos.y * constants.gridSize) + halfSize - this.pos.y;

				var toX = (toNode.pos.x * constants.gridSize) + halfSize - this.pos.x;
				var toY = (toNode.pos.y * constants.gridSize) + halfSize - this.pos.y;

				ctx.strokeStyle = linked ? '#fafcfc' : '#69696e';
				ctx.beginPath();
				ctx.moveTo(fromX, fromY);
				ctx.lineTo(toX, toY);
				ctx.closePath();
				ctx.stroke();
			}
		},

		events: {
			onMouseMove: function (pos) {
				if ((this.mouse.x == pos.x) && (this.mouse.y == pos.y))
					return;

				this.mouse = {
					x: pos.x,
					y: pos.y
				};
				this.makeDirty();
			},

			onPanStart: function (e) {
				this.panOrigin = {
					x: e.clientX,
					y: e.clientY
				};
			},

			onPan: function (e) {
				if (!this.panOrigin)
					return;

				if (!this.oldPos) {
					this.oldPos = {
						x: this.pos.x,
						y: this.pos.y
					};
				}

				var zoomPanMultiplier = this.currentZoom;
				var scrollSpeed = constants.scrollSpeed / zoomPanMultiplier;

				this.pos.x += (this.panOrigin.x - e.clientX) * scrollSpeed;
				this.pos.y += (this.panOrigin.y - e.clientY) * scrollSpeed;

				this.panOrigin = {
					x: e.clientX,
					y: e.clientY
				};

				this.makeDirty();
			},

			onPanEnd: function (e) {
				this.panOrigin = null;
			},

			onStartAreaSelect: function (e) {
				this.areaSelectOrigin = {
					x: e.x,
					y: e.y
				};
			},

			onEndAreaSelect: function (e) {
				events.emit('onAreaSelect', this.areaSelectOrigin, e);
				this.areaSelectOrigin = null;
			},

			onSelectGroup: function (pos) {
				this.pos.x = pos.x;
				this.pos.y = pos.y;

				this.makeDirty();
			}
		}
	};
});
