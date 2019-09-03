let sheets = require('../security/sheets');

module.exports = {
	getAccount: function (name) {
		return sheets.getRecord(name);
	},

	onBeforePlayerEnterGame: function (obj, blueprint) {
		let account = obj.account;
		let config = this.getAccount(account) || {};
		if (config.items) {
			let blueprintInventory = blueprint.components.find(c => (c.type === 'inventory'));
			if (!blueprintInventory) {
				blueprint.components.push({
					type: 'inventory',
					items: []
				});

				return;
			} else if (!blueprintInventory.items)
				blueprintInventory.items = [];

			let items = blueprintInventory.items;
			config.items.forEach(function (item) {
				let hasItem = items.find(i => (i.name === item.name));
				if (hasItem)
					return;

				items.push(item);
			}, this);
		}
	},

	getRoleLevel: function (player) {
		let account = player.account;
		let level = this.getAccount(account) ? this.getAccount(account).level : 0;

		return level;
	},

	isRoleLevel: function (player, requireLevel, message) {
		let account = player.account;
		let level = this.getAccount(account) ? this.getAccount(account).level : 0;

		let success = (level >= requireLevel);

		if ((!success) && (message))
			this.sendMessage(player, message);

		return success;
	},

	getRoleMessageStyle: function (player) {
		let account = player.account;
		return this.getAccount(account) ? this.getAccount(account).messageStyle : null;
	},

	getRoleMessagePrefix: function (player) {
		let account = player.account;
		return this.getAccount(account) ? this.getAccount(account).messagePrefix : null;
	},

	getSkins: function (account) {
		let skins = [];
		account = this.getAccount(account) || {
			skins: []
		};
		(account.skins || []).forEach(function (s) {
			skins.push(s);
		});

		skins = skins.filter((s, i) => (skins.indexOf(s) === i));
		return skins;
	},

	sendMessage: function (player, msg) {
		msg = 'Only certain roles can ' + msg + ' at the moment';

		player.instance.syncer.queue('onGetMessages', {
			id: player.id,
			messages: {
				class: 'color-redA',
				message: msg
			}
		}, [player.serverId]);
	}
};
