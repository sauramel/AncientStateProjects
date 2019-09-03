define([
	'js/system/events',
	'html!ui/templates/context/template',
	'css!ui/templates/context/styles',
	'html!ui/templates/context/templateItem'
], function (
	events,
	template,
	styles,
	templateItem
) {
	return {
		tpl: template,
		modal: true,

		postRender: function () {			
			this.onEvent('onContextMenu', this.onContextMenu.bind(this));
			this.onEvent('onHideContextMenu', this.onMouseDown.bind(this));
			this.onEvent('mouseDown', this.onMouseDown.bind(this));

			$('.ui-container').on('mouseup', this.onMouseDown.bind(this));
		},

		onContextMenu: function (config, e) {
			let container = this.el.find('.list')
				.empty();

			config.forEach(function (c, i) {
				let text = c.text ? c.text : c;

				let html = templateItem
					.replace('$TEXT$', text);

				let row = $(html)
					.appendTo(container);

				if (c.callback)
					row.on('click', this.onClick.bind(this, i, c.callback));
				else
					row.addClass('no-hover');
			}, this);

			this.el
				.css({
					left: e.clientX,
					top: e.clientY
				})
				.show();
		},

		onClick: function (index, callback) {
			this.el.hide();
			callback();
		},

		onMouseDown: function (e) {
			if (!this.el.is(':visible') || (e && (e.cancel || e.button === 2)))
				return;

			this.el.hide();
		}
	};
});
