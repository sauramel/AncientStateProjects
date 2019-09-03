let fs = require('fs');

let mod = {
	init: function (callback) {
		let app = require('express')();
		let server = require('http').createServer(app);
		let io = require('socket.io')(server);

		app.use(function (req, res, next) {
			if (req.url.indexOf('/server') != 0)
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

		app.get('/', this.requests.root.bind(this));
		app.get(/^(.*)$/, this.requests.default.bind(this));

		io.on('connection', this.listeners.onConnection.bind(this));

		let port = process.env.PORT || 5000;
		server.listen(port, function () {
			let message = 'Server: Ready';
			console.log(message);
		});
	},

	listeners: {
		onConnection: function (socket) {
			socket.on('request', this.listeners.onRequest.bind(this, socket));
		},

		onRequest: function (socket, msg, callback) {
			if (msg.action == 'load') {
				let res = JSON.parse(fs.readFileSync('saves/' + msg.fileName + '.json'));
				callback(res);
			} else if (msg.action == 'save')
				fs.writeFileSync('saves/' + msg.fileName + '.json', msg.data);
			else if (msg.action == 'getFileList') {
				callback(fs.readdirSync('saves/').map(l => (l.split('.')[0])));
				return;
			} else if (msg.action == 'persist')
				require('./persist')(msg.data);

			if (callback)
				callback();
		}
	},
	requests: {
		root: function (req, res) {
			res.sendFile('index.html');
		},

		default: function (req, res, next) {
			let root = req.url.split('/')[1];
			let file = req.params[0];

			file = file.replace('/' + root + '/', '');

			res.sendFile(file, {
				root: '../' + root
			});
		}
	}
};

mod.init();
