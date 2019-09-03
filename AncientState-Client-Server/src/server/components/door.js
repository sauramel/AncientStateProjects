module.exports = {
	type: 'door',

	locked: false,
	closed: true,
	key: null,

	autoCloseCd: 0,
	autoClose: null,
	destroyKey: false,

	openSprite: 157,
	closedSprite: 156,

	init: function (blueprint) {
		this.locked = blueprint.locked;
		this.key = blueprint.key;
		this.destroyKey = blueprint.destroyKey;
		this.autoClose = blueprint.autoClose;

		if (this.closed) {
			this.obj.instance.physics.setCollision(this.obj.x, this.obj.y, true);
			this.obj.instance.objects.notifyCollisionChange(this.obj.x, this.obj.y, true);
		}

		this.obj.instance.objects.buildObjects([{
			properties: {
				x: this.obj.x - 1,
				y: this.obj.y - 1,
				width: 3,
				height: 3,
				cpnNotice: {
					actions: {
						enter: {
							cpn: 'door',
							method: 'enterArea',
							targetId: this.obj.id,
							args: []
						},
						exit: {
							cpn: 'door',
							method: 'exitArea',
							targetId: this.obj.id,
							args: []
						}
					}
				}
			}
		}]);
	},

	exitArea: function (obj) {
		if (!obj.player)
			return;

		obj.syncer.setArray(true, 'serverActions', 'removeActions', {
			key: 'u',
			action: {
				targetId: this.obj.id,
				cpn: 'door',
				method: 'unlock'
			}
		});
	},

	enterArea: function (obj) {
		if (!obj.player)
			return;

		let canAction = true;
		let msg = 'Press U to open this door';

		if (this.closed) {
			if (this.locked) {
				let key = obj.inventory.items.find(i => ((i.keyId === this.key) || (i.keyId === 'world')));
				if (!key) {
					canAction = false;
					msg = 'You don\'t have the key to unlock this door';
				}
			}
		} else
			msg = 'Press U to close this door';

		if (canAction) {
			obj.syncer.setArray(true, 'serverActions', 'addActions', {
				key: 'u',
				name: this.closed ? 'open door' : 'close door',
				action: {
					targetId: this.obj.id,
					cpn: 'door',
					method: 'unlock'
				}
			});
		}

		this.obj.instance.syncer.queue('onGetAnnouncement', {
			src: this.obj.id,
			msg: msg
		}, [obj.serverId]);
	},

	unlock: function (msg) {
		if (!msg.sourceId)
			return;

		let obj = this.obj.instance.objects.objects.find(o => o.serverId === msg.sourceId);
		if ((!obj) || (!obj.player))
			return;

		let thisObj = this.obj;
		if ((Math.abs(thisObj.x - obj.x) > 1) || (Math.abs(thisObj.y - obj.y) > 1))
			return;
		else if ((thisObj.x === obj.x) && (thisObj.y === obj.y))
			return;

		let syncO = thisObj.syncer.o;

		if ((this.locked) && (this.closed)) {
			if (this.autoClose)
				this.autoCloseCd = this.autoClose;

			let key = obj.inventory.items.find(i => ((i.keyId === this.key) || (i.keyId === 'world')));
			if (!key)
				return;

			if (((key.singleUse) || (this.destroyKey)) && (key.keyId !== 'world')) {
				obj.inventory.destroyItem(key.id, 1);

				obj.instance.syncer.queue('onGetMessages', {
					id: obj.id,
					messages: [{
						class: 'color-redA',
						message: 'The ' + key.name + ' disintegrates on use',
						type: 'info'
					}]
				}, [obj.serverId]);
			}
		}

		if (this.closed) {
			thisObj.cell = this.openSprite;
			syncO.cell = this.openSprite;
			this.obj.instance.physics.setCollision(thisObj.x, thisObj.y, false);
			this.obj.instance.objects.notifyCollisionChange(thisObj.x, thisObj.y, false);

			this.closed = false;
			this.enterArea(obj);
		} else {
			thisObj.cell = this.closedSprite;
			syncO.cell = this.closedSprite;
			this.obj.instance.physics.setCollision(thisObj.x, thisObj.y, true);
			this.obj.instance.objects.notifyCollisionChange(thisObj.x, thisObj.y, true);

			this.closed = true;
			this.enterArea(obj);
		}
	},

	update: function () {
		if (!this.autoCloseCd)
			return;

		this.autoCloseCd--;

		if (this.autoCloseCd === 0) {
			this.obj.cell = this.closedSprite;
			this.obj.syncer.o.cell = this.closedSprite;
			this.obj.instance.physics.setCollision(this.obj.x, this.obj.y, true);

			this.closed = true;
		}
	}
};
