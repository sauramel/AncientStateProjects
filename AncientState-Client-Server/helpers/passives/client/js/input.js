define([
	'js/events',
	'js/renderer',
	'js/constants'
], function (
	events,
	renderer,
	constants
) {
	return {
		mappings: {
			8: 'backspace',
			9: 'tab',
			13: 'enter',
			16: 'shift',
			17: 'ctrl',
			27: 'esc',
			37: 'left',
			38: 'up',
			39: 'right',
			40: 'down',
			46: 'del'
		},

		mouse: {
			button: null,
			x: 0,
			y: 0,
			raw: null
		},

		keys: {},

		init: function () {
			$(window).on('keydown', this.events.keyboard.onKeyDown.bind(this));
			$(window).on('keyup', this.events.keyboard.onKeyUp.bind(this));

			$('canvas')
				.on('mousedown', this.events.mouse.onMouseDown.bind(this))
				.on('mouseup', this.events.mouse.onMouseUp.bind(this))
				.on('mousemove', this.events.mouse.onMouseMove.bind(this))
				.on('mousewheel', this.events.mouse.onMouseWheel.bind(this));
		},

		resetKeys: function () {
			for (let k in this.keys) 
				events.emit('onKeyUp', k);

			this.keys = {};
		},

		getMapping: function (charCode) {
			if (charCode >= 97)
				return (charCode - 96).toString();

			return (
				this.mappings[charCode] ||
				String.fromCharCode(charCode).toLowerCase()
			);
		},

		isKeyDown: function (key, consume) {
			let down = this.keys[key];
			if (down != null) {
				if (!consume)
					return true;
				
				this.keys[key] = 2;
				return (down == 1);
			} return false;
		},

		events: {
			keyboard: {
				onKeyDown: function (e) {
					if (e.target != document.body)
						return true;
					if ((e.keyCode == 9) || (e.keyCode == 8) || (e.keyCode == 122))
						e.preventDefault();

					let key = this.getMapping(e.which);

					if (this.keys[key] != null)
						this.keys[key] = 2;
					else {
						this.keys[key] = 1;
						events.emit('onKeyDown', key);
					}

					if (key == 'backspace')
						return false;
				},

				onKeyUp: function (e) {
					if (e.target != document.body)
						return;

					let key = this.getMapping(e.which);

					delete this.keys[key];

					events.emit('onKeyUp', key);
				}
			},

			mouse: {
				onMouseDown: function (e) {
					let el = $(e.target);
					if ((!el.hasClass('canvas')) || (el.hasClass('blocking')))
						return;

					let button = e.button;
					this.mouse.button = button;
					this.mouse.down = true;
					this.mouse.event = e;

					events.emit('onMouseDown', this.mouse);
				},

				onMouseUp: function (e) {
					let el = $(e.target);
					if ((!el.hasClass('canvas')) || (el.hasClass('blocking')))
						return;

					let button = e.button;
					this.mouse.down = false;

					events.emit('onMouseUp', this.mouse);

					this.mouse.button = null;
				},

				onMouseMove: function (e) {
					if (e)
						this.mouse.raw = e;
					else
						e = this.mouse.raw;

					if (!e)
						return;

					let el = $(e.target);
					if ((!el.hasClass('canvas')) || (el.hasClass('blocking')))
						return;

					let x = ~~((renderer.pos.x + (e.offsetX / renderer.currentZoom)) / constants.gridSize);
					let y = ~~((renderer.pos.y + (e.offsetY / renderer.currentZoom)) / constants.gridSize);

					this.mouse.x = x;
					this.mouse.y = y;

					events.emit('onMouseMove', this.mouse);
				},

				onMouseWheel: function (e) {
					events.emit('onMouseWheel', {
						delta: (e.deltaY > 0) ? 1 : -1
					});
				}
			}
		}
	};
});
