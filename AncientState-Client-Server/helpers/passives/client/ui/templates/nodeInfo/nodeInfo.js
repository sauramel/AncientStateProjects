define([
	'html!ui/templates/nodeInfo/template',
	'css!ui/templates/nodeInfo/styles',
	'js/constants',
	'js/input'
], function (
	template,
	styles,
	constants,
	input
) {
	return {
		tpl: template,

		nodes: null,
		statEl: null,

		postRender: function () {
			this.onEvent('onSelectNode', this.events.onSelectNode.bind(this));
			this.onEvent('onFocusNode', this.events.onFocusNode.bind(this));

			this.buildLookup();
		},

		buildLookup: function () {
			var container = this.find('.lookup');

			for (var p in constants.stats) {
				var statName = constants.stats[p];

				$('<div class="item">' + statName + '</div>')
					.appendTo(container)
					.on('click', this.events.onClickStat.bind(this, p));
			}
		},

		updateLabels: function () {
			var nodes = this.nodes;
			if (nodes.length == 1)
				nodes = nodes[0];
			var isArray = !!nodes.push;

			this.find('.lblId').html(isArray ? '' : nodes.id);

			var group = nodes.group;
			if (isArray) {
				group = nodes[0].group;
				if (nodes.some(n => (n.group != group)))
					group = '';
			}
			this.find('.lblGroup').html((group || []).toString());

			var size = nodes.size;
			if (isArray) {
				size = nodes[0].size;
				if (nodes.some(n => (n.size != size)))
					size = '';
			}
			size = ([
				'Lesser',
				'Greater',
				'Core'
			])[size];
			this.find('.lblType').html(size);

			var pos = isArray ? '' : nodes.pos.x + ', ' + nodes.pos.y;
			this.find('.lblPos').html(pos);
		},

		setStats: function () {
			var node = this.nodes[0];

			this.find('.stats').empty();

			if (!node.stats)
				node.stats = {};

			for (var p in node.stats) {
				this.buildStatSelector(p, node.stats[p]);
			}

			this.buildStatSelector();
		},

		buildStatSelector: function (stat, value) {
			var string = stat ? stat + ': ' + value : 'Select a stat...';

			$('<div class="item">' + string + '</div>')
				.appendTo(this.find('.stats'))
				.data('stat', {
					stat: stat,
					value: value
				})
				.on('mousewheel', this.events.onScrollStat.bind(this))
				.on('click', this.events.onShowLookup.bind(this));
		},

		updateNode: function () {
			var stats = {};
			this.find('.stats .item').toArray().forEach(function (s) {
				var stat = $(s).data('stat');
				if (!stat.stat)
					return;

				stats[stat.stat] = stat.value;
			});

			this.nodes[0].stats = stats;
		},

		actions: {

		},

		events: {
			onFocusNode: function (node) {
				this.events.onSelectNode.call(this, [node]);
			},

			onSelectNode: function (nodes) {
				this.nodes = nodes;

				if (nodes.length > 0)
					this.updateLabels();
				else if (nodes.length == 0)
					return;

				this.find('.nodeCount').html(nodes.length);

				this.setStats();
			},

			onClickStat: function (stat) {
				var string = stat + ': 1';
				this.statEl
					.html(string)
					.data('stat', {
						stat: stat,
						value: 1
					});

				this.statEl = null;

				this.find('.lookup').hide();

				this.updateNode();
				this.setStats();

				this.el.removeClass('picking');
			},

			onShowLookup: function (e) {
				this.statEl = $(e.currentTarget);
				this.find('.lookup').show();
				this.el.addClass('picking');
			},

			onScrollStat: function (e) {
				var el = $(e.currentTarget);
				var stat = el.data('stat');
				var delta = (e.originalEvent.deltaY > 0) ? -1 : 1;

				if (input.isKeyDown('shift')) {
					var nextValue = ~~((stat.value + (delta * 10)) / 10) * 10;
					delta = nextValue - stat.value;
				}

				stat.value += delta;

				var string = stat.stat + ': ' + stat.value;
				el.html(string);

				this.updateNode();
			}
		}
	}
});
