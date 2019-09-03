define([
	'js/system/events',
	'html!ui/templates/options/template',
	'css!ui/templates/options/styles',
	'js/rendering/renderer',
	'ui/factory',
	'js/objects/objects',
	'js/system/client',
	'js/sound/sound'
], function (
	events,
	template,
	styles,
	renderer,
	factory,
	objects,
	client,
	sound
) {
	return {
		tpl: template,
		centered: true,

		modal: true,

		postRender: function () {
			this.onEvent('onToggleOptions', this.toggle.bind(this));

			//Can only toggle fullscreen directly in a listener, not deferred the way wQuery does it
			this.el.find('.btnScreen')[0].addEventListener('click', this.toggleScreen.bind(this));
			this.el.find('.btnNames').on('click', events.emit.bind(events, 'onKeyDown', 'v'));
			this.el.find('.btnCharSelect').on('click', this.charSelect.bind(this));
			this.el.find('.btnLogOut').on('click', this.logOut.bind(this));
			this.el.find('.btnContinue').on('click', this.toggle.bind(this));
			this.el.find('.btnPatreon').on('click', this.patreon.bind(this));
			this.el.find('.btnIssue').on('click', this.reportIssue.bind(this));

			this.onEvent('onResize', this.onResize.bind(this));
		},
		
		reportIssue: function () {
			window.open('https://gitlab.com/Isleward/isleward/issues/new', '_blank');
		},

		patreon: function () {
			window.open('https://patreon.com/bigbadwaffle', '_blank');
		},

		charSelect: function () {
			this.el.addClass('disabled');

			client.request({
				module: 'cons',
				method: 'unzone',
				callback: this.onCharSelect.bind(this)
			});
		},

		onCharSelect: function () {
			renderer.clean();
			objects.onRezone();
			renderer.buildTitleScreen();
			sound.unload();

			events.emit('onShowCharacterSelect');
			$('[class^="ui"]:not(.ui-container)').toArray().forEach(el => {
				let ui = $(el).data('ui');
				if (ui && ui.destroy)
					ui.destroy();
			});
			factory.build('characters', {});
		},

		toggleScreen: function () {
			this.el.find('.btnScreen').html(renderer.toggleScreen());
		},

		onResize: function () {
			let isFullscreen = (window.innerHeight === screen.height);
			if (isFullscreen)
				this.el.find('.btnScreen').html('Windowed');
			else
				this.el.find('.btnScreen').html('Fullscreen');
		},

		toggle: function () {
			this.onResize();

			this.shown = !this.el.is(':visible');

			if (this.shown) {
				this.show();
				events.emit('onShowOverlay', this.el);
			} else {
				this.hide();
				events.emit('onHideOverlay', this.el);
			}
		},

		logOut: function () {
			window.location = window.location;
		},

		onKeyDown: function (key) {
			if (key === 'esc')
				this.toggle();
		}
	};
});
