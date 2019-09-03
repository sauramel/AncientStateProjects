var extend = require('extend');
var requirejs = require('requirejs');

global.extend = extend;

requirejs(['sim'], function (sim) {
	sim.init();
});
