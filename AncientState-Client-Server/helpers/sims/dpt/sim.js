define([
	'../../src/server/config/spellsConfig',
	'../../src/server/combat/combat'
], function (
	config,
	combat
) {
	var spells = config.spells;

	var max = false;
	var maxTarget = false;

	spells['harvest life'] = {
		statType: ['str', 'int'],
		statMult: 0.76,
		auto: true,
		cdMax: 6,
		manaCost: 0,
		range: 1,
		random: {
			damage: [1.5, 5.7],
			healPercent: [5, 15]
		}
	};

	var bloodBarrierMult = 1.25;
	spells['skeleton melee'] = {
		statType: ['str', 'int'],
		statMult: 0.27 * bloodBarrierMult,
		auto: true,
		cdMax: 5,
		manaCost: 0,
		range: 1,
		random: {
			damage: [1, 3.8]
		}
	};

	var level = 20;

	var hp = [
		32.70,
		65.40,
		98.10,
		130.80,
		163.50,
		196.20,
		228.90,
		261.60,
		294.30,
		327.00,
		359.70,
		392.40,
		425.10,
		457.80,
		490.50,
		523.20,
		555.90,
		588.60,
		621.30,
		654.00
	];

	var hpMax = [
		160.48,
		324.53,
		489.90,
		660.79,
		841.44,
		1036.21,
		1249.50,
		1485.85,
		1749.87,
		2046.32,
		2380.05,
		2756.08,
		3179.54,
		3655.72,
		4190.09,
		4788.27,
		5456.08,
		6199.50,
		7024.73,
		7938.17
	];

	return {
		init: function () {
			var res = [];

			for (var s in spells) {
				var c = spells[s];
				var d = c.random.damage || c.random.healing;
				if (!d)
					continue;

				var damage = d[0];
				if (max)
					damage = d[1];

				var config = {
					statType: c.statType,
					statMult: c.statMult,
					element: c.element,
					cd: c.cdMax,
					damage: damage,
					noCrit: true,
					noMitigate: !!c.random.healing,

					source: {
						stats: {
							values: {
								level: level,
								elementArcanePercent: 0,
								elementFrostPercent: 0,
								elementPoisonPercent: 0,
								elementHolyPercent: 0,
								elementFirePercent: 0
							}
						},
					},
					target: {
						stats: {
							values: {
								armor: maxTarget ? (level * 50) : (level * 20),
								elementAllResist: maxTarget ? 100 : 0,
								elementArcaneResist: 0,
								elementFrostResist: 0,
								elementPoisonResist: 0,
								elementHolyResist: 0,
								elementFireResist: 0
							}
						}
					}
				};

				var stat = c.statType;
				if (!stat.push)
					stat = [stat];

				var minStat = level;
				var maxStat = level * 5;

				var mult = (stat.length == 1) ? 1 : 1;

				stat.forEach(s => config.source.stats.values[s] = (max ? maxStat : minStat) * mult);

				var amount = combat.getDamage(config).amount;
				var duration = c.random.i_duration;
				if (duration)
					amount *= max ? duration[1] : duration[0];

				amount /= c.cdMax;

				var critChance = max ? 0.5 : 0.05;
				var critMult = max ? 3 : 1.5;

				amount = (amount * (1 - critChance)) + (amount * critChance * critMult);

				res.push({
					name: s,
					dpt: (~~(amount * 10) / 10),
					cd: c.cdMax,
					mana: c.manaCost || '',
					tpk: ~~((maxTarget ? hpMax : hp)[level - 1] / amount),
					amount: amount
				});
			}

			res = res.sort((a, b) => (b.dpt - a.dpt));

			console.log();
			console.log('ability              dpt');
			console.log();
			res.forEach(function (r) {
				var gap = new Array(20 - r.name.length);
				console.log(r.name + ': ' + gap.join(' ') + r.dpt + '       ' + r.tpk + ' ticks       ' + (~~((r.tpk / 2.85) * 10) / 10) + ' seconds');
			});
			console.log();
		}
	};
});
