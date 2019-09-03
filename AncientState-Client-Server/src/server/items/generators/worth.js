module.exports = {
	generate: function (item, blueprint) {
		item.worth = ~~(Math.pow(item.level, 1.5) + (Math.pow((item.quality + 1), 2) * 10));

		if (item.spell)
			item.worth *= 5;
	}
};
