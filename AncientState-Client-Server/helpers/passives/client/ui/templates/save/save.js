define([
	'html!./template',
	'css!./styles',
	'js/generator',
	'js/client'
], function (
	template,
	styles,
	generator,
	client
) {
	return {
		tpl: template,
		modal: true,
		centered: true,

		postRender: function () {
			this.find('input').focus();
			this.on('.btnSave', 'click', this.actions.onSave.bind(this));

			var loaded = $('.uiMenu').data('ui').loaded;
			if (loaded)
				this.find('.fileName').val(loaded);
		},

		actions: {
			onSave: function () {
				var fileName = this.val('.fileName');
				var data = generator.serialize();
				client.save(fileName, data);
				this.destroy();
			}
		}
	}
});
