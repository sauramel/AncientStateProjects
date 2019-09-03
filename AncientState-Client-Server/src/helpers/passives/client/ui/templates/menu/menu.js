define([
	'html!./template',
	'css!./styles',
	'ui/factory',
	'js/generator',
	'js/renderer',
	'js/constants',
	'js/client'
], function (
	template,
	styles,
	uiFactory,
	generator,
	renderer,
	constants,
	client
) {
	return {
		tpl: template,

		loaded: null,

		postRender: function () {
			if (constants.standAlone)
				this.find('.content > *:not(.btnNew):not(.btnImport):not(.btnExport)').addClass('disabled');

			this.on('.btnNew', 'click', this.actions.onNew.bind(this));
			this.on('.btnLoad', 'click', this.actions.onLoad.bind(this));
			this.on('.btnSave', 'click', this.actions.onSave.bind(this));
			this.on('.btnExport', 'click', this.actions.onExport.bind(this));
			this.on('.btnImport', 'click', this.actions.onImport.bind(this));
			this.on('.btnPersist', 'click', this.actions.onPersist.bind(this));
		},

		actions: {
			onNew: function () {
				this.loaded = null;
				generator.callAction('reset');
				renderer.makeDirty();
			},

			onLoad: function () {
				uiFactory.build('load');
			},

			onSave: function () {
				uiFactory.build('save');
			},

			onExport: function () {
				uiFactory.build('export');
			},

			onImport: function () {
				uiFactory.build('import');
			},

			onPersist: function () {
				client.persist(generator.getData());
			}
		}
	};
});
