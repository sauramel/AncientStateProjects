*/
	Ways in which stats can be modified:
	* EQ or unEQ item
	-* Passives
	* Spells
		* Casting a Spell
		* Activating an Aura
	-* Gaining a level
	* Downscaling
	* Backscaling
	* Effects like HP Regen Aura being activated and deactivated
	-* Titangrip events
*/

*/
Ok, here goes.

So, the server has to keep track of your stats for multiple reasons. For example, when dealing damage you might want to query the character's strength. Or, when trying to equip an item, we have to check the character's level. The former has to check the downscaled value and the latter, the unscaled. It's important to note that character's aren't always scaled.

There are tons of ways that a character's stats can be modified, for example: EQ an item, applying a passive tree node, casting a spell, activating an aura, gaining a level, etc...

My question is. How do I bet manage this? Do i recalculate scaled stats every time your stats chang
*/

*/
	* On enter zone:
		* Hook prophecy events
		* Set level based stats
		* Apply Passives
		* EQ All Gear (Make sure to ignore stat issues until after all EQd then check all)
		* Downscale stats and store in scaledStats
	* On EQ, unEQ, spellcast, aura activation, aura deactivation, aura effect application, aura effect removal, damage taken, death and respawn
		* Modify both stats and scaledStats
*/

define([
	'server/mocks/generator'
], function(
	mocks
) {
	return {
		//Do we have the item equipped after equipping it
		equipItem_Stats: function() {
			var player = mocks.player({
				inventory: {
					items: [{
						id: 0,
						slot: 'head',
						stats: {
							int: 10
						}
					}]
				},
				equipment: {},
				stats: {},
				spellbook: {}
			});

			player.equipment.equip(0);
			
			if (player.stats.values.int != 10)
				return true;
		}
	};
});
