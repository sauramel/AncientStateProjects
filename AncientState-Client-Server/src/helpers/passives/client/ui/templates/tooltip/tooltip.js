define([
	'html!./template',
	'css!./styles'
], function (
	template,
	styles
) {
	return {
		tpl: template,

		postRender: function () {
			this.onEvent('onShowTooltip', this.events.onShowTooltip.bind(this));
			this.onEvent('onHideTooltip', this.events.onHideTooltip.bind(this));
		},

		events: {
			onShowTooltip: function (mouse, text) {
				this.show();

				this.el.html(text);

				this.el.css({
					left: mouse.raw.clientX + 20,
					top: mouse.raw.clientY
				});
			},

			onHideTooltip: function () {
				this.hide();
			}
		}
	}
});
