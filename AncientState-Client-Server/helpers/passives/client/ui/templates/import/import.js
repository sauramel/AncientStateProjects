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
		modal: true,
		centered: true,

		postRender: function () {
			this.on('.btnImport', 'click', this.events.onImport.bind(this));
		},

		events: {
			onImport: function () {
				var val = this.find('textarea').val();

				try {
					var data = JSON.parse(val);
					generator.callAction('load', data);
					this.destroy();
				} catch (e) {}
			}
		}
	}
});
