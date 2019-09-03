define([
	'html!./template',
	'css!./styles',
	'js/events'
], function (
	template,
	styles,
	events
) {
	return {
		tpl: template,
		modal: true,
		centered: true,

		postRender: function () {
			this.find('input').focus();

			this.onEvent('onRenameGroup', this.events.onRenameGroup.bind(this));
		},

		actions: {
			onOk: function (callback) {
				var groupName = this.val('.groupName');
				this.destroy();

				callback(groupName);
			}
		},

		events: {
			onRenameGroup: function (oldName, callback) {
				if (oldName)
					this.find('input').val(oldName);

				this.on('.btnOk', 'click', this.actions.onOk.bind(this, callback));
			}
		}
	}
});
