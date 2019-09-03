define([
	'server/mocks/generator'
], function(
	mocks
) {
	return {
		//Do you get the correct reputation when talking to a faction vendor for the first time
		startTalk_DiscoverFaction: function() {
			var factionBase = require('../src/server/config/factionBase');
			var anglers = require('../src/server/config/factions/anglers');
			var factionBlueprint = extend(true, {}, factionBase, anglers);

			var player = mocks.player({
				dialogue: {

				},
				reputation: {
					getBlueprint: function() {
						return factionBlueprint;
					}
				}
			});

			var resultMsg = null;
			player.instance.syncer.queue = function(event, msg) {
				resultMsg = msg.messages[0].message;
			};

			var target = mocks.player({
				dialogue: {

				},
				trade: {
					faction: {
						id: 'anglers'
					}
				}
			});

			player.dialogue.talk({
				target: target
			});

			var rep = player.reputation.list[0];
			if (rep.rep != factionBlueprint.initialRep)
				return true;
			else if (resultMsg.indexOf(' friendly ') == -1)
				return true;
			else {
				var tierName = factionBlueprint.tiers.find(t => (t.rep == rep.rep)).name.toLowerCase();
				if (resultMsg.indexOf(` ${tierName} `) == -1)
					return true;
			}
		}
	};
});