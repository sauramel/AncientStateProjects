/* global require */
window.require = requirejs;

require.config({
	baseUrl: '',
	waitSeconds: 120,
	paths: {
		socket: 'plugins/socket',
		wquery: 'plugins/jquery.min',
		text: 'plugins/text',
		html: 'plugins/html',
		css: 'plugins/css',
		main: 'js/main',
		helpers: 'js/misc/helpers',
		particles: 'plugins/pixi.particles',
		picture: 'plugins/pixi.picture',
		pixi: 'plugins/pixi.min',
		howler: 'plugins/howler.min'
	},
	shim: {
		howler: {
			exports: 'howl'
		},
		socket: {
			exports: 'io'
		},
		wquery: {
			exports: '$'
		},
		helpers: {
			deps: [
				'wquery'
			]
		},
		pixi: {
			exports: 'PIXI'
		},
		particles: {
			deps: [
				'pixi'
			]
		},
		picture: {
			deps: [
				'pixi'
			]
		},
		main: {
			deps: [
				'helpers',
				'js/input'
			]
		}
	}
});

require([
	'main'
], function (
	main
) {
	main.init();
});
