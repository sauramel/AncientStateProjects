define([
	'js/system/events'
], function (
	events
) {
	return {
		centeredX: false,
		centeredY: false,

		el: null,
		options: null,
		shown: true,

		eventCallbacks: {},

		render: function () {
			let container = '.ui-container';
			if (this.container)
				container += ' > ' + this.container;

			this.el = $(this.tpl)
				.appendTo(container)
				.data('ui', this);

			this.el.on('mouseenter', this.onMouseEnter.bind(this, true));
			this.el.on('mouseleave', this.onMouseEnter.bind(this, false));

			if (this.modal)
				this.el.addClass('modal');

			if (this.hasClose)
				this.buildClose();

			if (this.postRender)
				this.postRender();

			if (this.centered) {
				this.centeredX = true;
				this.centeredY = true;
			}

			if ((this.centeredX) || (this.centeredY))
				this.center(this.centeredX, this.centeredY);

			this.shown = this.el.is(':visible');
		},

		onMouseEnter: function (enter) {
			events.emit('onUiHover', enter);
		},

		setOptions: function (options) {
			this.options = options;
		},

		on: function (el, eventName, callback) {
			if (typeof (el) === 'string')
				el = this.find(el);
			else
				el = $(el);

			el.on(eventName, function () {
				let args = [].slice.call(arguments, 1);
				args.splice(0, 0, eventName);

				callback.apply(null, args);
			});
		},

		find: function (selector) {
			return this.el.find(selector);
		},

		center: function (x, y) {
			if (x !== false)
				x = true;
			if (y !== false)
				y = true;

			this.centeredX = x;
			this.centeredY = y;

			let el = this.el;
			let pat = el.parent();
			if (!pat[0])
				return;

			let posX = ~~((pat.width() / 2) - (el.width() / 2)) - 10;
			let posY = ~~((pat.height() / 2) - (el.height() / 2)) - 10;

			el.css('position', 'absolute');
			if (x)
				el.css('left', posX);
			if (y)
				el.css('top', posY);
		},

		show: function () {
			if (this.modal)
				$('.modal').hide();

			this.shown = true;
			this.el.show();

			if (this.onAfterShow)
				this.onAfterShow();

			if ((this.centeredX) || (this.centeredY))
				this.center(this.centeredX, this.centeredY);
		},

		hide: function () {
			if (this.beforeHide)
				this.beforeHide();

			this.shown = false;
			this.el.hide();
		},

		destroy: function () {
			this.offEvents();

			if (this.beforeDestroy)
				this.beforeDestroy();

			this.el.remove();
		},

		val: function (selector) {
			return this.find(selector).val();
		},

		setDisabled: function (isDisabled) {
			this.el.removeClass('disabled');

			if (isDisabled)
				this.el.addClass('disabled');
		},

		onEvent: function (eventName, callback) {
			let list = this.eventCallbacks[eventName] || (this.eventCallbacks[eventName] = []);
			let eventCallback = events.on(eventName, callback);
			list.push(eventCallback);

			return eventCallback;
		},

		offEvent: function (eventCallback) {
			for (let e in this.eventCallbacks) {
				this.eventCallbacks[e].forEach(function (c) {
					if (c === eventCallback)
						events.off(e, c);
				}, this);
			}
		},

		offEvents: function () {
			for (let e in this.eventCallbacks) {
				this.eventCallbacks[e].forEach(function (c) {
					events.off(e, c);
				}, this);
			}
		},

		toggle: function () {
			this.shown = !this.el.is(':visible');

			if (this.shown)
				this.show();
			else
				this.hide();
		},

		buildClose: function () {
			$('<div class="btn btnClose">x</div>')
				.appendTo(this.find('.heading').eq(0))
				.on('click', this.toggle.bind(this));	
		}
	};
});
