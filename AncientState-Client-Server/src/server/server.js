let compression = require('compression');
let minify = require('express-minify');
let config = require('./config/serverConfig');
let router = require('./security/router');
let rest = require('./security/rest');

module.exports = {
	init: function (callback) {
		let app = require('express')();
		let server = require('http').createServer(app);
		let socketServer = require('socket.io')(server);

		global.cons.sockets = socketServer.sockets;

		app.use(compression());
		app.use(minify());

		app.use(function (req, res, next) {
			if (
				!rest.willHandle(req.url) && 
				req.url.indexOf('/server') !== 0 && 
				req.url.indexOf('/mods') !== 0
			)
				req.url = '/client/' + req.url;

			next();
		});

		let lessMiddleware = require('less-middleware');
		app.use(lessMiddleware('../', {
			force: true,
			render: {
				strictMath: true
			}
		}));

		rest.init(app);

		app.get('/', this.requests.root.bind(this));
		app.get(/^(.*)$/, this.requests.default.bind(this));

		socketServer.on('connection', this.listeners.onConnection.bind(this));

		let port = config.port || 4000;
		server.listen(port, function () {
			let message = config.startupMessage || 'Server: Ready';
			_.log(message);

			callback();
		});
	},
	listeners: {
		onConnection: function (socket) {
			socket.on('handshake', this.listeners.onHandshake.bind(this, socket));
			socket.on('disconnect', this.listeners.onDisconnect.bind(this, socket));
			socket.on('request', this.listeners.onRequest.bind(this, socket));

			socket.emit('handshake');
		},
		onHandshake: function (socket) {
			cons.onHandshake(socket);
		},
		onDisconnect: function (socket) {
			cons.onDisconnect(socket);
		},
		onRequest: function (socket, msg, callback) {
			msg.callback = callback;

			if (!msg.data)
				msg.data = {};

			if (msg.cpn) {
				if (!router.allowedCpn(msg))
					return;

				cons.route(socket, msg);
			} else {
				if (!router.allowedGlobal(msg))
					return;

				msg.socket = socket;
				global[msg.module][msg.method](msg);
			}
		}
	},
	requests: {
		root: function (req, res) {
			res.sendFile('index.html');
		},
		default: function (req, res) {
			let root = req.url.split('/')[1];
			let file = req.params[0];

			file = file.replace('/' + root + '/', '');

			if (root === 'server' && (file.indexOf('mods') === -1 || file.indexOf('png') === -1))
				return null;

			res.sendFile(file, {
				root: '../' + root
			});
		}
	}
};
