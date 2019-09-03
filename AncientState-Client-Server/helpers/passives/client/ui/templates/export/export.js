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
			var data = generator.serialize();
			this.find('textarea').val(data);
		}
	}
});
