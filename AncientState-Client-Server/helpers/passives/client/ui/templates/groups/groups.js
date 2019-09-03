define([
	'html!./template',
	'css!./styles',
	'js/generator',
	'js/client',
	'js/renderer',
	'js/input',
	'ui/factory',
	'js/events'
], function (
	template,
	styles,
	generator,
	client,
	renderer,
	input,
	uiFactory,
	events
) {
	return {
		tpl: template,

		postRender: function () {
			this.onEvent('onTreeLoaded', this.events.onTreeLoaded.bind(this));
			this.onEvent('onNew', this.events.onNew.bind(this));
			this.onEvent('onDeleteNode', this.events.onDeleteNode.bind(this));
			this.onEvent('onSelectNode', this.events.onSelectNode.bind(this));

			this.on('.btnAdd', 'click', this.actions.add.bind(this));
			this.on('.btnRename', 'click', this.events.onClickRename.bind(this));
			this.on('.btnRemove', 'click', this.events.onClickRemove.bind(this));
		},

		addGroup: function (groupName) {
			var el = $('<div class="item">' + groupName + '</div>')
				.appendTo(this.find('.list'))
				.attr('group', groupName);

			el.on('click', this.events.onClickGroup.bind(this));
		},

		actions: {
			add: function () {
				var selected = generator.nodes.filter(n => n.selected);
				var groupName = 'group-' + this.find('.list .item').length;

				selected.forEach(function (s) {
					if (!s.group)
						s.group = [];

					s.group.push(groupName)
				});

				this.addGroup(groupName);
			},

			rename: function (newName) {
				var el = this.find('.list .active').eq(0);
				if (!el)
					return;

				var oldName = el.attr('group');

				el
					.html(newName)
					.attr('group', newName);

				generator.nodes
					.filter(n => ((n.group) && (n.group.indexOf(oldName) > -1)))
					.forEach(function (n) {
						var group = n.group;
						group.spliceWhere(g => (g == oldName));
						group.push(newName);
					});
			},

			remove: function (group) {
				generator.nodes.forEach(function (g) {
					if ((g.group) && (g.group.indexOf(group) > -1)) {
						g.group.spliceWhere(g => (g == group));
						if (g.group.length == 0)
							delete g.group;
					}
				});

				this.find('.item[group="' + group + '"]').remove();
			}
		},

		events: {
			onNew: function () {
				this.find('.list').empty();
			},

			onDeleteNode: function (node) {
				if ((!node.group) || (node.group.length == 0))
					return;

				node.group.forEach(function (g) {
					var hasSiblings = generator.nodes.some(n => ((n.group) && (n.group.indexOf(g) > -1)))
					if (!hasSiblings)
						this.find('.item[group="' + g + '"]').remove();
				}, this);
			},

			onClickRename: function (e) {
				uiFactory.build('renameGroup', {
					onDone: this.events.onRenameGroupBuilt.bind(this)
				});
			},

			onRenameGroupBuilt: function () {
				var oldName = null;
				var el = this.find('.list .active').eq(0);
				if (el)
					oldName = el.attr('group');

				events.emit('onRenameGroup', oldName, this.actions.rename.bind(this));
			},

			onClickRemove: function (e) {
				var el = this.find('.list .active').eq(0);
				if (!el)
					return;

				el.remove();
				var groupName = el.attr('group');

				generator.nodes
					.filter(n => ((n.group) && (n.group.indexOf(groupName) > -1)))
					.forEach(function (n) {
						n.group.spliceWhere(g => (g == groupName));
					});
			},

			onTreeLoaded: function (tree) {
				var container = this.find('.list').empty();
				var groups = [];

				tree.nodes
					.filter(n => !!n.group)
					.sort(function (a, b) {
						if (a.group < b.group)
							return -1;
						else if (b.group < a.group)
							return 1;
					})
					.forEach(function (n) {
						n.group.forEach(function (g) {
							if (groups.indexOf(g) > -1)
								return;

							this.addGroup(g);
							groups.push(g);
						}, this);
					}, this);
			},

			onClickGroup: function (e) {
				var group = $(e.currentTarget).attr('group');

				var pos = {
					x: 0,
					y: 0
				};

				var nodes = generator.nodes
					.filter(function (n) {
						if ((!n.group) || (n.group.indexOf(group) == -1))
							return false;

						pos.x += n.pos.x;
						pos.y += n.pos.y;

						return true;
					});

				pos.x /= nodes.length;
				pos.y /= nodes.length;

				generator.callAction('selectNode', nodes);

				if (input.isKeyDown('shift')) {
					renderer.center({
						pos: pos
					});
				}
				renderer.makeDirty();
			},

			onSelectNode: function (nodes) {
				this.find('.list .active').removeClass('active');

				var selectedGroup = null;

				nodes.forEach(function (n) {
					(n.group || []).forEach(function (g) {
						var list = generator.nodes.filter(a => ((a.group) && (a.group.indexOf(g) > -1)));
						var check = nodes.filter(a => ((a.group) && (a.group.indexOf(g) > -1)));
						if (list.length == check.length)
							selectedGroup = g;
					});
				});

				if (selectedGroup)
					this.find('.list .item[group="' + selectedGroup + '"]').addClass('active');
			}
		}
	}
});
