module.exports = {
	events: {
		onGetText: function (item) {
			let rolls = item.effects.find(e => (e.type === 'reduceRuneManaReserve')).rolls;

			return `Reduces the mana reserved by ${rolls.rune} by ${rolls.amount}%`;
		},

		onBeforeReserveMana: function (item, reserveEvent) {
			let rolls = item.effects.find(e => (e.type === 'reduceRuneManaReserve')).rolls;

			if (rolls.rune.toLowerCase() !== reserveEvent.spell.toLowerCase())
				return;

			reserveEvent.reservePercent = Math.max(0, (reserveEvent.reservePercent * 100) - rolls.amount) / 100;
		},

		afterEquipItem: function (item) {
			let rolls = item.effects.find(e => (e.type === 'reduceRuneManaReserve')).rolls;
			if (!rolls)
				return;

			let spell = this.spellbook.spells.find(s => s.active && s.name.toLowerCase() === rolls.rune);
			if (!spell)
				return;

			let spellReserve = spell.manaReserve.percentage;

			this.stats.addStat('manaReservePercent', -Math.min(spellReserve, (rolls.amount / 100)));
		},

		afterUnequipItem: function (item) {
			let rolls = item.effects.find(e => (e.type === 'reduceRuneManaReserve')).rolls;
			if (!rolls)
				return;

			let spell = this.spellbook.spells.find(s => s.active && s.name.toLowerCase() === rolls.rune);
			if (!spell)
				return;

			let spellReserve = spell.manaReserve.percentage;

			let stats = this.stats;
			let newReserve = stats.manaReservePercent + (Math.max(0, (spellReserve * 100) - rolls.amount) / 100) - spellReserve;

			stats.addStat('manaReservePercent', Math.min(spellReserve, (rolls.amount / 100)));
			if (newReserve < 0)
				this.spellbook.removeSpellById(spell.id);
		}
	}
};
