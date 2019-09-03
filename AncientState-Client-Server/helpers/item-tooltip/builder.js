$(function () {
	var items = [{
		name: `Infernal Bite`,
		type: 'Curved Sword',
		rqr: {
			level: 25,
			dex: 200
		},
		quality: 4,
		stats: {
			Dexterity: '[200 - 300]',
			'Increased Crit Multiplier': '[40% - 65%]',
			'Your hits always critically hit': null,
			'50% of your damage is converted to fire damage': null,
			'You take [2% - 5%] of all damage you deal yourself': null
		},
		spritesheet: '../../src/client/images/items.png',
		sprite: [9, 9]
	}, {
		name: `Cowl of Obscurity`,
		type: 'Silk Cowl',
		rqr: {
			level: 20,
			dex: 150
		},
		quality: 4,
		stats: {
			Vitality: '[20 - 35]',
			Dexterity: '[150 - 220]',
			'Critical hits heal you for [1% - 3%] of your maximum health': null,
			'Your hits have a 50% chance to miss': null,
		},
		spritesheet: '../../src/client/images/items.png',
		sprite: [0, 4]
	}];

	for (var i = 0; i < items.length - 1; i++) {
		$('.tooltip:first-child').clone().appendTo('body');
	}

	items.forEach(function (item, i) {
		var div = $('.tooltip').eq(i);

		for (var p in item) {
			var val = item[p];

			div.find('.' + p).html(val);
		}

		var stats = item.stats;
		if (stats) {
			var val = '';
			for (var s in stats) {
				var v = s;
				if (stats[s])
					v = stats[s] + ' ' + s;
				val += '<div class="stat">' + v + '</div>';
			}
			div.find('.stats').html(val);
		}

		var rqr = item.rqr;
		if (rqr) {
			var val = 'Requires: ';
			for (var s in rqr) {
				val += rqr[s] + ' ' + s;
				if (Object.keys(rqr).indexOf(s) < Object.keys(rqr).length - 1)
					val += ', ';
			}
			div.find('.rqr').html(val);
		}

		div.find('.sprite')
			.css({
				background: 'url(' + item.spritesheet + ') ' + (-item.sprite[0] * 64) + 'px ' + (-item.sprite[1] * 64) + 'px'
			})
			.html('');

		div.find('.name').addClass('q' + item.quality);
	});
});
