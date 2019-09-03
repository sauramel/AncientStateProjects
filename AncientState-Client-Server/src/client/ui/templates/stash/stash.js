define([
	'js/system/events',
	'js/system/client',
	'html!ui/templates/stash/template',
	'css!ui/templates/stash/styles',
	'html!ui/templates/inventory/templateItem',
	'js/input'
], function (
	events,
	client,
	template,
	styles,
	tplItem,
	input
) {
	return {
		tpl: template,

		centered: true,
		hoverItem: null,

		items: [],

		modal: true,
		hasClose: true,

		postRender: function () {
			this.onEvent('onGetStashItems', this.onGetStashItems.bind(this));
			this.onEvent('onDestroyStashItems', this.onDestroyStashItems.bind(this));
			this.onEvent('onKeyDown', this.onKeyDown.bind(this));
			this.onEvent('onKeyUp', this.onKeyUp.bind(this));
			this.onEvent('onOpenStash', this.toggle.bind(this));
		},

		build: function () {
			let container = this.el.find('.grid')
				.empty();

			let items = this.items;
			let iLen = Math.max(items.length, 50);

			for (let i = 0; i < iLen; i++) {
				let item = items[i];

				let itemEl = $(tplItem)
					.appendTo(container);

				if (!item)
					continue;

				let imgX = -item.sprite[0] * 64;
				let imgY = -item.sprite[1] * 64;

				let spritesheet = item.spritesheet || '../../../images/items.png';
				if (!item.spritesheet) {
					if (item.material)
						spritesheet = '../../../images/materials.png';
					else if (item.quest)
						spritesheet = '../../../images/questItems.png';
					else if (item.type === 'consumable')
						spritesheet = '../../../images/consumables.png';
				}

				let moveHandler = this.onHover.bind(this, itemEl, item);
				let downHandler = () => {};
				if (isMobile) {
					moveHandler = () => {};
					downHandler = this.onHover.bind(this, itemEl, item);
				}

				itemEl
					.data('item', item)
					.on('mousedown', downHandler)
					.on('mousemove', moveHandler)
					.on('mouseleave', this.hideTooltip.bind(this, itemEl, item))
					.find('.icon')
					.css('background', 'url(' + spritesheet + ') ' + imgX + 'px ' + imgY + 'px')
					.on('contextmenu', this.showContext.bind(this, item));

				if (item.quantity)
					itemEl.find('.quantity').html(item.quantity);

				if (item.eq)
					itemEl.addClass('eq');
				if (item.isNew)
					itemEl.addClass('new');
			}
		},

		showContext: function (item, e) {
			events.emit('onContextMenu', [{
				text: 'withdraw',
				callback: this.withdraw.bind(this, item)
			}], e);

			e.preventDefault();
			return false;
		},

		hideTooltip: function () {
			events.emit('onHideItemTooltip', this.hoverItem);
			this.hoverItem = null;
		},
		
		onHover: function (el, item, e) {
			if (item)
				this.hoverItem = item;
			else
				item = this.hoverItem;

			let ttPos = null;

			if (el) {
				el.removeClass('new');
				delete item.isNew;

				let elOffset = el.offset();
				ttPos = {
					x: ~~(elOffset.left + 74),
					y: ~~(elOffset.top + 4)
				};
			}
		
			events.emit('onShowItemTooltip', item, ttPos, true);
		},

		onClick: function (el, item) {
			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'equipment',
					method: 'equip',
					data: item.id
				}
			});
		},

		onGetStashItems: function (items) {
			this.items = items;

			if (this.shown)
				this.build();
		},

		onDestroyStashItems: function (itemIds) {
			itemIds.forEach(function (id) {
				let item = this.items.find(i => i.id === id);
				if (item === this.hoverItem) 
					this.hideTooltip();

				this.items.spliceWhere(i => i.id === id);
			}, this);

			if (this.shown)
				this.build();
		},

		toggle: function () {
			if ((!this.shown) && (!window.player.stash.active))
				return;

			this.shown = !this.el.is(':visible');

			if (this.shown) {
				this.show();
				events.emit('onShowOverlay', this.el);
				this.build();
			} else {
				this.hide();
				events.emit('onHideOverlay', this.el);
				events.emit('onHideContextMenu');
			}
		},

		onOpenStash: function () {
			this.build();
		},

		beforeDestroy: function () {
			events.emit('onHideOverlay', this.el);
		},

		withdraw: function (item) {
			if (!item)
				return;

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'stash',
					method: 'withdraw',
					data: item.id
				}
			});
		},

		onKeyDown: function (key) {
			if (key === 'shift' && this.hoverItem)
				this.onHover();
			else if (key === 'esc' && this.shown)
				this.toggle();
		},

		onKeyUp: function (key) {
			if (key === 'shift' && this.hoverItem)
				this.onHover();
		}
	};
});
