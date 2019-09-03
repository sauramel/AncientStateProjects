module.exports = {
	save: function () {
		if (!this.persist)
			return null;

		let values = {};
		for (let p in this) {
			let value = this[p];
			if ((typeof(value) === 'function') || (p === 'obj') || (p === 'events'))
				continue;

			values[p] = value;
		}

		if (!values.expire)
			values.expire = (+new Date()) + (this.ttl * consts.tickTime);

		return values;
	},

	simplify: function () {
		return this.type;
	}	
};
