define([
	'js/system/events',
	'html!ui/templates/buffs/template',
	'css!ui/templates/buffs/styles',
	'html!ui/templates/buffs/templateBuff'
], function (
	events,
	template,
	styles,
	templateBuff
) {
	let icons = {
		stunned: [4, 0],
		regenHp: [3, 1],
		regenMana: [4, 1],
		swiftness: [5, 1],
		stealth: [7, 0],
		reflectDamage: [2, 1],
		holyVengeance: [4, 0]
	};

	return {
		tpl: template,

		icons: {},

		postRender: function () {
			this.onEvent('onGetBuff', this.onGetBuff.bind(this));
			this.onEvent('onRemoveBuff', this.onRemoveBuff.bind(this));
		},

		onGetBuff: function (buff) {
			let icon = icons[buff.type];
			if (!icon)
				return;

			let imgX = icon[0] * -32;
			let imgY = icon[1] * -32;

			let html = templateBuff;
			let el = $(html).appendTo(this.el)
				.find('.inner')
				.css({
					background: 'url(../../../images/statusIcons.png) ' + imgX + 'px ' + imgY + 'px'
				});

			this.icons[buff.id] = el.parent();
		},

		onRemoveBuff: function (buff) {
			let el = this.icons[buff.id];
			if (!el)
				return;

			el.remove();
			delete this.icons[buff.id];
		}
	};
});
