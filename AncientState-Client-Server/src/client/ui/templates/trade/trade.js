define([
	'js/system/events',
	'js/system/client',
	'html!ui/templates/trade/template',
	'css!ui/templates/trade/styles',
	'html!ui/templates/inventory/templateItem'
], function (
	events,
	client,
	template,
	styles,
	tplItem
) {
	return {
		tpl: template,

		centered: true,

		modal: true,
		hasClose: true,

		list: null,
		action: null,

		postRender: function () {
			this.onEvent('onGetTradeList', this.onGetTradeList.bind(this));
			this.onEvent('onCloseTrade', this.hide.bind(this));
		},

		onGetTradeList: function (itemList, action) {
			itemList = itemList || this.itemList;
			action = action || this.action;

			this.itemList = itemList;
			this.action = action;

			this.find('.heading-text').html(action);

			let uiInventory = $('.uiInventory').data('ui');

			let container = this.el.find('.grid')
				.empty();

			let buyItems = itemList.items;

			buyItems.forEach(function (item) {
				if ((item === this.hoverItem))
					this.onHover(null, item);
			}, this);

			let iLen = Math.max(buyItems.length, 50);
			for (let i = 0; i < iLen; i++) {
				let item = buyItems[i];

				if (action === 'sell') {
					item = buyItems.find(function (b) {
						return (b.pos === i);
					});
				}

				if (!item) {
					$(tplItem)
						.appendTo(container)
						.on('click', uiInventory.hideTooltip.bind(uiInventory));

					continue;
				}

				item = $.extend(true, {}, item);

				let size = 64;
				let offset = 0;

				let itemEl = $(tplItem)
					.appendTo(container);

				let spritesheet = item.spritesheet || '../../../images/items.png';
				if (!item.spritesheet) {
					if (item.material)
						spritesheet = '../../../images/materials.png';
					else if (item.quest)
						spritesheet = '../../../images/questItems.png';
					else if (item.type === 'consumable')
						spritesheet = '../../../images/consumables.png';
					else if (item.type === 'skin')
						spritesheet = '../../../images/characters.png';
				}
				if (item.type === 'skin') {
					offset = 4;
					size = 8;
				}

				let imgX = (-item.sprite[0] * size) + offset;
				let imgY = (-item.sprite[1] * size) + offset;

				itemEl
					.data('item', item)
					.find('.icon')
					.css('background', 'url(' + spritesheet + ') ' + imgX + 'px ' + imgY + 'px')
					.addClass(item.type);

				if (isMobile)
					itemEl.on('click', this.onHover.bind(this, itemEl, item, action));
				else {
					itemEl
						.on('click', this.onClick.bind(this, itemEl, item, action))
						.on('mousemove', this.onHover.bind(this, itemEl, item, action))
						.on('mouseleave', uiInventory.hideTooltip.bind(uiInventory, itemEl, item));
				}

				if (item.quantity)
					itemEl.find('.quantity').html(item.quantity);
				else if (item.eq)
					itemEl.find('.quantity').html('EQ');

				if (action === 'buy') {
					let noAfford = false;
					if (item.worth.currency) {
						let currencyItems = window.player.inventory.items.find(f => f.name === item.worth.currency);
						noAfford = ((!currencyItems) || (currencyItems.quantity < item.worth.amount));
					} else
						noAfford = (item.worth * this.itemList.markup > window.player.trade.gold);

					if (!noAfford && item.factions)
						noAfford = item.factions.some(f => f.noEquip);

					if (noAfford)
						$('<div class="no-afford"></div>').appendTo(itemEl);
				}

				if (item.worth.currency)
					item.worthText = item.worth.amount + 'x ' + item.worth.currency;
				else
					item.worthText = ~~(itemList.markup * item.worth);

				if (item.eq)
					itemEl.addClass('eq');
				else if (item.isNew) {
					itemEl.addClass('new');
					itemEl.find('.quantity').html('NEW');
				}
			}

			this.center();
			this.show();
			events.emit('onShowOverlay', this.el);
		},

		onClick: function (el, item, action, e) {
			el.addClass('disabled');

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'trade',
					method: 'buySell',
					data: {
						itemId: item.id,
						action: action
					}
				},
				callback: this.onServerRespond.bind(this, el)
			});

			let uiInventory = $('.uiInventory').data('ui');
			uiInventory.hideTooltip(el, item, e);
		},

		onHover: function (el, item, action, e) {
			let uiInventory = $('.uiInventory').data('ui');
			uiInventory.onHover(el, item, e);

			let canAfford = true;
			if (action === 'buy') {
				if (item.worth.currency) {
					let currencyItems = window.player.inventory.items.find(i => i.name === item.worth.currency);
					canAfford = (currencyItems && currencyItems.quantity >= item.worth.amount);
				} else
					canAfford = (item.worth * this.itemList.markup <= window.player.trade.gold);
			}

			let uiTooltipItem = $('.uiTooltipItem').data('ui');
			uiTooltipItem.showWorth(canAfford);

			if (isMobile)
				uiTooltipItem.addButton(action, this.onClick.bind(this, el, item, action));
		},

		beforeHide: function () {
			events.emit('onHideOverlay', this.el);
			$('.uiInventory').data('ui').hideTooltip();
		},

		onServerRespond: function (el) {
			el.removeClass('disabled');
		}
	};
});
