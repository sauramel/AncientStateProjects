module.exports = {
	rewards: [],

	init: function (hideMessage) {
		if (!this.build())
			return false;

		if (!this.xp) {
			let level = this.obj.instance.spawners.zone.level;
			level = level[0];
			let xp = ~~(level * 22 * this.getXpMultiplier());
			this.xp = xp;
		}

		this.obj.syncer.setArray(true, 'quests', 'obtainQuests', this.simplify(true));

		if (!hideMessage) {
			this.obj.instance.syncer.queue('onGetMessages', {
				id: this.obj.id,
				messages: [{
					class: 'color-yellowB',
					message: 'quest obtained (' + this.name + ')'
				}]
			}, [this.obj.serverId]);
		}

		return true;
	},

	ready: function () {
		this.isReady = true;

		if (this.oReady)
			this.oReady();

		this.obj.instance.syncer.queue('onGetMessages', {
			id: this.obj.id,
			messages: [{
				class: 'color-yellowB',
				message: 'quest ready for turn-in (' + this.name + ')'
			}]
		}, [this.obj.serverId]);

		this.obj.syncer.setArray(true, 'quests', 'updateQuests', this.simplify(true));
	},

	complete: function () {
		if (this.oComplete)
			this.oComplete();

		let obj = this.obj;

		this.obj.instance.eventEmitter.emitNoSticky('beforeCompleteAutoquest', this, obj);

		obj.instance.syncer.queue('onGetMessages', {
			id: obj.id,
			messages: [{
				class: 'color-yellowB',
				message: 'quest completed (' + this.name + ')'
			}]
		}, [obj.serverId]);

		obj.syncer.setArray(true, 'quests', 'completeQuests', this.id);

		this.obj.instance.eventEmitter.emit('onCompleteQuest', this);

		this.rewards.forEach(function (r) {
			this.obj.inventory.getItem(r);
		}, this);

		this.obj.stats.getXp(this.xp || 10, this.obj, this);
	},

	simplify: function (self) {
		let values = {};
		for (let p in this) {
			let value = this[p];
			if (typeof (value) === 'function' || ['obj', 'events'].includes(p))
				continue;

			values[p] = value;
		}

		return values;
	}
};
