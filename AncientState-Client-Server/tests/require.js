var module = require('module');
var originalRequire = module.prototype.require;

module.prototype.require = function (name) {
	var res = null;
	try {
		res = originalRequire.call(this, name);
	} catch (e) {
		try {
			res = originalRequire.call(this, __dirname + '/' + name);
		} catch (err) { }

	}

	return res;
}
