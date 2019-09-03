let roles = require('../config/roles');

module.exports = {
	type: 'portal',

	toZone: null,
	toPos: null,

	patronLevel: 0,

	init: function (blueprint) {
		this.toPos = blueprint.pos;
		this.toZone = blueprint.zone;
		this.patronLevel = ~~blueprint.patron;
	},

	collisionEnter: function (obj) {
		if (!obj.player)
			return;
		else if (this.patronLevel) {
			if (!roles.isRoleLevel(obj, this.patronLevel, 'enter this area'))
				return;
		}

		obj.fireEvent('beforeRezone');

		obj.destroyed = true;

		let simpleObj = obj.getSimple(true, false, true);
		simpleObj.x = this.toPos.x;
		simpleObj.y = this.toPos.y;

		process.send({
			method: 'rezone',
			id: obj.serverId,
			args: {
				obj: simpleObj,
				newZone: this.toZone
			}
		});
	}
};
