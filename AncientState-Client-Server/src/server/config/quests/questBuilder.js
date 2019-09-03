let questTemplate = require('./templates/questTemplate');
let globalQuests = require('../questsBase');
let mapList = require('../maps/mapList');

module.exports = {
	instance: null,

	init: function (instance) {
		this.instance = instance;
	},
	obtain: function (obj, template) {
		let zoneName = template ? template.zoneName : obj.zoneName;
		let zonePath = mapList.mapList.find(m => m.name === zoneName).path;
		let oQuests = obj.quests;
		if (oQuests.quests.filter(q => q.zoneName === zoneName).length > 0)
			return;

		let zoneTemplate = null;

		try {			
			zoneTemplate = require('../../' + zonePath + '/' + zoneName + '/quests.js');
		} catch (e) {
			zoneTemplate = globalQuests;
		}

		if (!zoneTemplate)
			zoneTemplate = globalQuests;

		let config = extend({}, zoneTemplate);
		this.instance.eventEmitter.emit('onBeforeGetQuests', config);
		if (config.infini.length === 0)
			return;

		let pickQuest = null;
		if ((template) && (template.type))
			pickQuest = config.infini.find(c => c.type === template.type);

		if (!pickQuest)
			pickQuest = config.infini[~~(Math.random() * config.infini.length)];
		let pickType = pickQuest.type[0].toUpperCase() + pickQuest.type.substr(1);
		let questClass = require('../../config/quests/templates/quest' + pickType);

		let quest = extend({}, pickQuest, questTemplate, questClass, template);

		if (template)
			quest.xp = template.xp;

		//Calculate next id
		let id = 0;
		let currentQuests = oQuests.quests;
		let cLen = currentQuests.length;
		for (let i = 0; i < cLen; i++) {
			let q = currentQuests[i];
			if (q.id >= id)
				id = q.id + 1;
		}
		quest.id = id;
		quest.obj = obj;
		quest.zoneName = zoneName;

		if (!oQuests.obtain(quest, !!template))
			this.obtain(obj, template);
	}
};
