define([
	'js/system/events',
	'js/system/client',
	'html!ui/templates/reputation/template',
	'css!ui/templates/reputation/styles'
], function (
	events,
	client,
	template,
	styles
) {
	return {
		tpl: template,

		centered: true,
		modal: true,
		hasClose: true,

		list: null,

		postRender: function () {
			this.onEvent('onGetReputations', this.onGetReputations.bind(this));
			this.onEvent('onShowReputation', this.toggle.bind(this, true));
		},

		build: function () {
			let list = this.list;

			this.find('.info .heading-bottom').html('');
			this.find('.info .description').html('');
			this.find('.bar-outer').hide();

			if (list.length === 0)
				this.find('.heading-bottom').html("you haven't discovered any factions yet");
			else
				this.find('.heading-bottom').html('select a faction to see more info');

			let elList = this.find('.list').empty();

			list.forEach(function (l) {
				if (l.noGainRep)
					return;

				let html = '<div class="faction">' + l.name.toLowerCase() + '</div>';

				let el = $(html)
					.appendTo(elList);

				el
					.on('click', this.onSelectFaction.bind(this, el, l));
			}, this);
		},

		onSelectFaction: function (el, faction) {
			this.find('.selected').removeClass('selected');
			el.addClass('selected');

			this.find('.info .heading-bottom').html(faction.name.toLowerCase());
			this.find('.info .description').html(faction.description.toLowerCase());

			let rep = faction.rep;
			let tier = faction.tier;
			let tiers = faction.tiers;
			let prevTier = tiers[tier];
			let nextTier = (tier === tiers.length - 1) ? tiers[tiers.length - 1] : tiers[tier + 1];

			let percentage = (rep - prevTier.rep) / (nextTier.rep - prevTier.rep) * 100;
			this.find('.bar-outer').show();

			this.find('.front').css({
				width: percentage + '%'
			});

			let w = ~~(this.find('.front').width() / 5) * 5;
			this.find('.front').css({
				width: w
			});

			percentage = ~~(percentage * 10) / 10;

			this.find('.tier').html(tiers[tier].name.toLowerCase() + ' (' + percentage + '%)');
		},

		onGetReputations: function (list) {
			this.list = list;
			this.list.sort(function (a, b) {
				if (a.name[0] < b.name[0])
					return -1;
				return 1;
			});

			if (this.el.is(':visible'))
				this.build();
		},

		toggle: function () {
			let shown = !this.el.is(':visible');

			if (shown) {
				this.build();
				this.show();
			} else
				this.hide();
		}
	};
});
