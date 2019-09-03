require.config({
	baseUrl: '',
	waitSeconds: 120,
	paths: {
		'jquery': 'plugins/jquery.min',
		'text': 'plugins/text',
		'html': 'plugins/html',
		'css': 'plugins/css',
		'socket': 'plugins/socket'
	},
	shim: {
		'jquery': {
			exports: '$'
		},
		'socket': {
			exports: 'io'
		}
	}
});

require([
	'js/helpers',
	'jquery',
	'js/main'
], function (
	helpers,
	jQuery,
	main
) {
	main.init();
});
