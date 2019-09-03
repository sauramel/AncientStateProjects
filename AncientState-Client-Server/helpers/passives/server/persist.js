const fs = require('fs');

module.exports = function (data) {
	const serverString = `module.exports = ${JSON.stringify(data, null, '\t')};`;
	fs.writeFileSync('../../../src/server/config/passiveTree.js', serverString);

	const clientString = `define([], function() { return ${JSON.stringify(data)}; });`;
	fs.writeFileSync('../../../src/client/ui/templates/passives/temp.js', clientString);
};
