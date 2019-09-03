module.exports = {
	queue: {},
	busy: {},

	init: function (instance) {
		this.instance = instance;
	},

	getMail: async function (playerName, noBlock) {
		if (!noBlock)
			this.busy[playerName] = (this.busy[playerName] || 0) + 1;

		let player = this.instance.objects.objects.find(o => (o.name === playerName));
		if (!player) {
			process.send({
				method: 'callDifferentThread',
				playerName: playerName,
				data: {
					module: 'mail',
					method: 'getMail',
					args: [playerName]
				}
			});

			this.busy[playerName]--;

			this.processQueue(playerName);
			return;
		}

		let result = await io.getAsync({
			key: playerName,
			table: 'mail',
			noParse: true
		});

		this.busy[playerName]--;

		await this.onGetMail(player, result);
	},

	onGetMail: async function (player, result) {
		if (result === 'null')
			result = null;
		else if (result) {
			result = result.split('`').join('\'');
			//Hack for weird google datastore error
			if (result[0] === '<')
				return;
		}

		result = JSON.parse(result || '[]');

		let sentMessages = [];

		let inventory = player.inventory;
		let stash = player.stash;

		result.forEach(function (r) {
			if (r.removeAll) {
				for (let i = 0; i < inventory.items.length; i++) {
					let item = inventory.items[i];
					if ((r.nameLike) && (item.name.indexOf(r.nameLike) > -1)) {
						inventory.destroyItem(item.id, item.quantity ? item.quantity : null);
						i--;
					}
				}

				if (stash) {
					for (let i = 0; i < stash.items.length; i++) {
						let item = stash.items[i];
						if ((r.nameLike) && (item.name.indexOf(r.nameLike) > -1)) {
							stash.destroyItem(item.id);
							i--;
						}
					}
				}
			} else {
				if ((r.msg) && (!sentMessages.some(s => (s === r.msg)))) {
					player.instance.syncer.queue('onGetMessages', {
						id: player.id,
						messages: [{
							class: 'color-greenB',
							message: r.msg,
							type: 'info'
						}]
					}, [player.serverId]);

					sentMessages.push(r.msg);
					delete r.msg;
				}
				inventory.getItem(r);
			}
		});

		await io.setAsync({
			key: player.name,
			table: 'mail',
			value: ''
		});

		this.processQueue(player.name);
	},

	processQueue: function (playerName) {
		if (this.busy[playerName])
			return;

		let queue = this.queue[playerName];
		if (!queue)
			return;

		delete this.queue[playerName];
		this.sendMail(playerName, queue);
	},

	sendMail: async function (playerName, items, callback) {
		if (this.busy[playerName]) {
			let queue = this.queue[playerName];
			if (!queue) 
				queue = this.queue[playerName] = [];

			queue.push(...extend([], items));
			return;
		}

		//Only maintain the busy queue on child threads
		//since the parent thread never actually distributes items
		if (process.send)
			this.busy[playerName] = (this.busy[playerName] || 0) + 1;

		if (!items.push)
			items = [items];

		let result = await io.getAsync({
			key: playerName,
			table: 'mail',
			noParse: true
		});

		this.doSendMail(playerName, items, callback, result);
	},

	doSendMail: async function (playerName, items, callback, result) {
		if (result === 'null')
			result = null;

		result = JSON.parse(result || '[]');

		items.forEach(function (i) {
			result.push(i);
		});

		let itemString = JSON.stringify(result).split('\'').join('`');

		await io.setAsync({
			key: playerName,
			table: 'mail',
			value: itemString
		});

		(callback || this.getMail.bind(this, playerName, true))();
	}
};
