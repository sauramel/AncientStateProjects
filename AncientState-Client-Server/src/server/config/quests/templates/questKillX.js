module.exports = {
	need: 10,
	have: 0,

	mobType: null,

	type: 'killX',

	build: function () {
		//If we're not in the correct zone, don't do this check, it'll just crash the server
		// since the mob won't be available (most likely) in the zoneFile
		if (this.obj.zoneName === this.zoneName) {
			let mobTypes = this.obj.instance.spawners.zone.mobs;
			if (this.mobName) {
				let mobType = mobTypes[this.mobName.toLowerCase()];
				//Maybe the zoneFile changed in the meantime. If so, regenerate
				if ((!mobType) || (mobType.attackable === false))
					this.mobName = null;
			}

			if (!this.mobName) {
				let mobCounts = this.obj.instance.spawners.mobTypes;
				let keys = Object.keys(mobTypes).filter(function (m) {
					let mobBlueprint = mobTypes[m];

					return (
						(m !== 'default') &&
						(
							(mobBlueprint.attackable) ||
							(!mobBlueprint.has('attackable'))
						) &&
						(mobBlueprint.level <= ~~(this.obj.stats.values.level * 1.35)) &&
						(mobCounts[m] > 1)
					);
				}, this);

				//No level appropriate mobs found
				if (keys.length === 0)
					return false;

				this.mobType = keys[~~(Math.random() * keys.length)];
				let needMax = 8;
				this.mobName = this.mobType.replace(/\w\S*/g, function (txt) {
					return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
				});

				this.need = Math.max(1, ~~((needMax * 0.2) + (Math.random() * needMax * 0.8)));
			}
		}

		this.description = 'Kill ' + this.have + '/' + this.need + ' ' + this.mobName;

		return true;
	},

	getXpMultiplier: function () {
		return this.need;
	},

	events: {
		afterKillMob: function (mob) {
			if (
				this.obj.zoneName !== this.zoneName ||
				mob.name.toLowerCase() !== this.mobName.toLowerCase() || 
				this.have >= this.need
			)
				return;

			this.have++;
			this.description = 'Kill ' + this.have + '/' + this.need + ' ' + this.mobName;

			if (this.have >= this.need)
				this.ready();

			this.obj.syncer.setArray(true, 'quests', 'updateQuests', this.simplify(true));
		}
	}
};
