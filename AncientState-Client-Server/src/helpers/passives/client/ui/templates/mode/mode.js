define([
	'html!./template',
	'css!./styles',
	'js/generator'
], function (
	template,
	styles,
	generator
) {
	return {
		tpl: template,

		loaded: null,

		postRender: function () {
			this.on('.btn', 'click', this.events.onChangeMode.bind(this));
		},

		events: {
			onChangeMode: function (event, e) {
				var el = $(e.currentTarget);
				this.find('.active').removeClass('active');
				el.addClass('active');

				var mode = el.attr('mode');
				generator.setMode(mode);
			}
		}
	}
});
