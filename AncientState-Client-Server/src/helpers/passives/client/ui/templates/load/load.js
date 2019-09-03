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
			this.on('.btnLoad', 'click', this.actions.onLoad.bind(this));

			client.getFileList(this.events.onGetFileList.bind(this));
		},

		actions: {
			onLoad: function (fileName) {
				client.load(fileName, generator.actions.load.bind(generator));
				this.destroy();
			}
		},

		events: {
			onGetFileList: function (list) {
				var el = this.find('.list').empty();

				list.forEach(function (l) {
					$('<div class="item">' + l + '</div>')
						.appendTo(el)
						.on('click', this.events.onClickItem.bind(this, l));
				}, this);
			},

			onClickItem: function (item) {
				this.actions.onLoad.call(this, item);

				$('.uiMenu').data('ui').loaded = item;
			}
		}
	}
});
