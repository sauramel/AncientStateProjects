define([
	'js/events',
	'js/generator',
	'js/renderer',
	'js/input',
	'ui/factory',
	'js/client',
	'js/constants'
], function (
	events,
	generator,
	renderer,
	input,
	uiFactory,
	client,
	constants
) {
	return {
		init: function () {
			if (constants.standAlone)
				this.events.onConnected.call(this);
			else
				client.init(this.events.onConnected.bind(this));
		},

		render: function () {
			if (renderer.dirty)
				renderer.render(generator.nodes, generator.links);

			window.requestAnimationFrame(this.render.bind(this));
		},

		events: {
			onConnected: function () {
				uiFactory.init();

				generator.init();
				renderer.init();
				input.init();

				events.on('onMouseDown', this.events.onMouseDown.bind(this, true));
				events.on('onMouseUp', this.events.onMouseDown.bind(this, false));
				events.on('onMouseMove', this.events.onMouseMove.bind(this));
				events.on('onMouseWheel', this.events.onMouseWheel.bind(this));
				events.on('onKeyDown', this.events.onKeyDown.bind(this));

				$(window).on('focus', this.events.onFocus.bind(this));

				uiFactory.build('mode');
				uiFactory.build('menu');
				uiFactory.build('groups');
				uiFactory.build('nodeInfo');
				uiFactory.build('tooltip');

				renderer.center(generator.nodes[0]);
				this.render();
			},

			onMouseDown: function (isDown, e) {
				var success = false;

				if ((input.isKeyDown('shift')) && (e.button == 2)) {
					success = true;

					if (e.down)
						events.emit('onStartAreaSelect', e);
					else
						events.emit('onEndAreaSelect', e);
				} else if (isDown) {
					if (generator.mode != 'none') {
						e.button = ([
							'place',
							'link',
							'select'
						]).indexOf(generator.mode);
					}

					var action = ([
						'addNode',
						'connectNode',
						'selectNode'
					])[e.button];

					success = generator.callAction(action, {
						x: e.x,
						y: e.y,
						shiftDown: input.isKeyDown('shift')
					});
				} else if ((!isDown) && (e.button != 1) && (generator.getSelected().length <= 1))
					generator.callAction('selectNode', {});

				if ((!isDown) || (!success))
					renderer.pan(e.raw, isDown ? 'down' : 'up');

				renderer.makeDirty();
			},

			onMouseMove: function (e) {
				if ((!e.down) || (e.button != 2) || (input.isKeyDown('shift')))
					return;

				if (generator.callAction('moveNode', {
						x: e.x,
						y: e.y
					}))
					return;

				renderer.pan(e.raw, 'move');
			},

			onMouseWheel: function (e) {
				var delta = (e.delta > 0) ? 1 : 0;

				var action = ([
					'resizeNode',
					'recolorNode'
				])[delta];
				if (!action)
					return;

				if (!generator.callAction(action, {}))
					renderer.zoom(delta);

				renderer.makeDirty();
			},

			onKeyDown: function (key) {
				if (key == 'z') {
					renderer.zoom(0, 1);
					renderer.makeDirty();
					return;
				}

				var action = ({
					d: 'deleteNode',
					c: 'recolorNode',
					r: 'resizeNode'
				})[key];
				if (!action)
					return;

				generator.callAction(action, {});

				renderer.makeDirty();
			},

			onFocus: function () {
				renderer.makeDirty();
			}
		}
	};
});
