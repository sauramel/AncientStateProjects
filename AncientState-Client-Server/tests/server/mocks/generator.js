define([
	
], function(
	
) {
	return {
		nextId: 0,

		player: function(blueprint) {
			var result = {
				id: this.nextId++,
				fireEvent: function() {},
				syncer: {},
				instance: {
					syncer: {
						queue: function() {}
					}
				}
			};

			blueprint.syncer = {};

			for (var p in blueprint) {
				var componentTemplate = require('../src/server/components/' + p);
				var component = extend(true, {}, componentTemplate, blueprint[p]);

				component.obj = result;			

				result[p] = component
			}

			return result;
		},

		mob: function(blueprint) {
			
		}
	};
});