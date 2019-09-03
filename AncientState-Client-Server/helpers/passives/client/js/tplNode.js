define([

], function (

) {
	return {
		color: 0,
		size: 0,
		pos: {
			x: 0,
			y: 0
		},

		build: function (options) {
			var res = $.extend(true, {}, this, {
				id: options.id,
				pos: {
					x: options.x,
					y: options.y
				}
			});
			delete res.build;

			return res;
		}
	};
});
