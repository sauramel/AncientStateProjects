define([
	'js/system/events'
], function (
	events
) {
	return {
		type: 'reputation',

		list: [],
		factions: [],

		init: function () {
			events.emit('onGetReputations', this.list);
		},

		extend: function (blueprint) {
			if (blueprint.modifyRep) {
				blueprint.modifyRep.forEach(function (m) {
					let exists = this.list.find(l => (l.id === m.id));
					if (!exists)
						this.list.push(m);
					else {
						for (let p in m) 
							exists[p] = m[p];
					}
				}, this);

				delete blueprint.modifyRep;

				events.emit('onGetReputations', this.list);
			}
		}
	};
});
