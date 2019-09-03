define([
	'js/system/events',
	'js/system/client',
	'html!ui/templates/workbench/template',
	'css!ui/templates/workbench/styles'
], function (
	events,
	client,
	template,
	styles
) {
	return {
		tpl: template,

		centered: true,

		modal: true,

		workbenchId: null,

		recipes: null,
		currentRecipe: null,

		postRender: function () {
			this.onEvent('onOpenWorkbench', this.onOpenWorkbench.bind(this));
			this.onEvent('onCloseWorkbench', this.hide.bind(this));

			this.on('.btnCraft', 'click', this.craft.bind(this));
			this.on('.btnCancel', 'click', this.hide.bind(this));
		},

		onOpenWorkbench: function (msg) {
			this.workbenchId = msg.workbenchId;
			this.find('.heading-text').html(msg.name);

			this.renderRecipes(msg.recipes);

			this.show();
		},

		renderRecipes: function (recipes) {
			this.recipes = recipes;

			let container = this.find('.list').empty();

			recipes.forEach(function (r) {
				let el = $('<div class="item">' + r + '</div>')
					.appendTo(container);

				el.on('click', this.onSelectRecipe.bind(this, el, r));
			}, this);
		},

		onSelectRecipe: function (el, recipeName) {
			el.parent().find('.selected').removeClass('selected');
			el.addClass('selected');

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					targetId: this.workbenchId,
					cpn: 'workbench',
					method: 'getRecipe',
					data: {
						name: recipeName		
					}
				},
				callback: this.onGetRecipe.bind(this)
			});
		},

		onGetRecipe: function (recipe) {
			this.currentRecipe = recipe;

			this.find('.title').html(recipe.name);
			this.find('.description').html(recipe.description);

			this.find('.materialList .material').remove();

			let container = this.find('.materialList')
				.css({
					visibility: 'visible'
				});

			let canCraft = true;

			recipe.materials.forEach(function (m) {
				let el = $('<div class="material">' + m.quantity + 'x ' + (m.nameLike || m.name) + '</div>')
					.appendTo(container);

				if (m.need) {
					canCraft = false;
					el.addClass('need');
				}
			});

			this.find('.btnCraft')
				.removeClass('disabled');

			if (!canCraft) {
				this.find('.btnCraft')
					.addClass('disabled');
			}
		},

		craft: function () {
			let selectedRecipe = this.find('.list .item.selected').html();

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					targetId: this.workbenchId,
					cpn: 'workbench',
					method: 'craft',
					data: {
						name: selectedRecipe
					}
				},
				callback: this.onCraft.bind(this)
			});
		},

		onCraft: function (recipe) {
			this.onGetRecipe(recipe);
		},

		onAfterShow: function () {
			this.clear();
		},

		clear: function () {
			this.find('.left .list .selected').removeClass('selected');
			this.find('.title').html('');
			this.find('.description').html('');
			this.find('.materialList .material').remove();
			this.find('.materialList')
				.css({
					visibility: 'hidden'
				});
			this.find('.btnCraft').addClass('disabled');
		}
	};
});
