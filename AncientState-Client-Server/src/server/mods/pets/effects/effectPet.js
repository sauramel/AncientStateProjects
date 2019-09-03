module.exports = {
	type: 'pet',

	pet: null,

	init: function () {
		
	},

	simplify: function () {
		return {
			type: 'pet',
			ttl: this.ttl
		};
	},

	destroy: function () {
		this.pet.destroyed = true;

		this.source.useText = 'summon';
		this.obj.syncer.setArray(true, 'inventory', 'getItems', this.source);
	},

	events: {
		beforeCastSpell: function (castEvent) {
			this.destroyed = true;
		},

		beforeTakeDamage: function (dmgEvent) {
			this.destroyed = true;
		}
	}
};
