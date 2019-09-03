define([
	'socket'
], function (
	io
) {
	return {
		socket: null,

		init: function (onReady) {
			let tType = 'websocket';
			this.socket = io({
				transports: [tType]
			});

			this.socket.on('connect', this.onConnected.bind(this, onReady));
		},

		load: function (fileName, callback) {
			this.socket.emit('request', {
				fileName: fileName,
				action: 'load'
			}, callback);
		},

		save: function (fileName, data, callback) {
			this.socket.emit('request', {
				fileName: fileName,
				action: 'save',
				data: data
			}, callback);
		},

		persist: function (data) {
			this.socket.emit('request', {
				action: 'persist',
				data: data
			});
		},

		getFileList: function (callback) {
			this.socket.emit('request', {
				action: 'getFileList'
			}, callback);
		},

		onConnected: function (onReady) {
			onReady();
		}
	};
});
