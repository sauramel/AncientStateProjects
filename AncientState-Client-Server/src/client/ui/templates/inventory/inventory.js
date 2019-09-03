define([
	'js/system/events',
	'js/system/client',
	'html!ui/templates/inventory/template',
	'css!ui/templates/inventory/styles',
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

		items: [],

		dragItem: null,
		dragEl: null,
		hoverCell: null,

		modal: true,
		hasClose: true,
		
		oldSpellsZIndex: 0,

		postRender: function () {
			this.onEvent('onGetItems', this.onGetItems.bind(this));
			this.onEvent('onDestroyItems', this.onDestroyItems.bind(this));
			this.onEvent('onShowInventory', this.toggle.bind(this));

			this.onEvent('onKeyDown', this.onKeyDown.bind(this));
			this.onEvent('onKeyUp', this.onKeyUp.bind(this));

			this.find('.grid')
				.on('mousemove', this.onMouseMove.bind(this))
				.on('mouseleave', this.onMouseDown.bind(this, null, null, false));

			this.find('.split-box .amount')
				.on('mousewheel', this.onChangeStackAmount.bind(this))
				.on('input', this.onEnterStackAmount.bind(this));

			this.find('.split-box').on('click', this.splitStackEnd.bind(this, true));
			this.find('.split-box .btnSplit').on('click', this.splitStackEnd.bind(this, null));
			this.find('.split-box .btnLess').on('click', this.onChangeStackAmount.bind(this, null, -1));
			this.find('.split-box .btnMore').on('click', this.onChangeStackAmount.bind(this, null, 1));
			this.find('.btnSortInv').on('click', this.onSortInventory.bind(this));
		},

		build: function () {
			let container = this.el.find('.grid')
				.empty();

			let items = this.items
				.filter(function (item) {
					return !item.eq;
				});

			let iLen = Math.max(items.length, 50);

			let rendered = [];

			for (let i = 0; i < iLen; i++) {
				let itemEl = null;

				let item = items.find(f => (f.pos !== null && f.pos === i));

				if (!item) {
					itemEl = $(tplItem)
						.appendTo(container);

					itemEl
						.on('mouseup', this.onMouseDown.bind(this, null, null, false))
						.on('mousemove', this.onHover.bind(this, itemEl, item))
						.on('mouseleave', this.hideTooltip.bind(this, itemEl, item))
						.children()
						.remove();

					continue;
				} else 
					rendered.push(item);

				let imgX = -item.sprite[0] * 64;
				let imgY = -item.sprite[1] * 64;

				itemEl = $(tplItem)
					.appendTo(container);

				let spritesheet = item.spritesheet || '../../../images/items.png';
				if (!item.spritesheet) {
					if (item.material)
						spritesheet = '../../../images/materials.png';
					else if (item.quest)
						spritesheet = '../../../images/questItems.png';
					else if (item.type === 'consumable')
						spritesheet = '../../../images/consumables.png';
				}

				let clickHandler = this.onMouseDown.bind(this, itemEl, item, true);
				let moveHandler = this.onHover.bind(this, itemEl, item);
				if (isMobile) {
					clickHandler = this.onHover.bind(this, itemEl, item);
					moveHandler = () => {};
				}

				itemEl
					.data('item', item)
					.on('click', this.onClick.bind(this, item))
					.on('mousedown', clickHandler)
					.on('mouseup', this.onMouseDown.bind(this, null, null, false))
					.on('mousemove', moveHandler)
					.on('mouseleave', this.hideTooltip.bind(this, itemEl, item))
					.find('.icon')
					.css('background', 'url(' + spritesheet + ') ' + imgX + 'px ' + imgY + 'px')
					.on('contextmenu', this.showContext.bind(this, item));

				if (item.quantity > 1 || item.eq || item.active || item.has('quickSlot')) {
					let elQuantity = itemEl.find('.quantity');
					let txtQuantity = item.quantity;
					if (!txtQuantity)
						txtQuantity = item.has('quickSlot') ? 'QS' : 'EQ';

					elQuantity.html(txtQuantity);

					//If the item doesn't have a quantity and we reach this point
					//it must mean that it's active, EQd or QSd
					if (!item.quantity)
						itemEl.addClass('eq');
				} else if (item.isNew) {
					itemEl.addClass('new');
					itemEl.find('.quantity').html('NEW');
				}
			}
		},

		onClick: function (item) {
			let msg = {
				item: item,
				success: true
			};
			events.emit('beforeInventoryClickItem', msg);

			if (!msg.success)
				return;

			if (!input.isKeyDown('ctrl', true))
				return;

			client.request({
				cpn: 'social',
				method: 'chat',
				data: {
					message: '{' + item.name + '}',
					item: item
				}
			});
		},

		onMouseDown: function (el, item, down, e) {
			if (e.button !== 0)
				return;

			if (down) {
				this.dragEl = el.clone()
					.appendTo(this.find('.grid'))
					.hide()
					.on('mouseup', this.onMouseDown.bind(this, null, null, false))
					.addClass('dragging');

				this.dragItem = el;

				events.emit('onHideItemTooltip', this.hoverItem);
				this.hoverItem = null;
			} else if (this.dragItem) {
				let method = 'moveItem';

				if ((this.hoverCell) && (this.hoverCell[0] !== this.dragItem[0])) {
					let placeholder = $('<div></div>')
						.insertAfter(this.dragItem);

					this.dragItem.insertBefore(this.hoverCell);
					this.hoverCell.insertBefore(placeholder);
					placeholder.remove();

					let msgs = [{
						id: this.dragItem.data('item').id,
						pos: this.dragItem.index()
					}];

					this.items.find(function (i) {
						return (i.id === this.dragItem.data('item').id);
					}, this).pos = this.dragItem.index();

					let hoverCellItem = this.hoverCell.data('item');
					if (hoverCellItem) {
						if ((hoverCellItem.name !== this.dragItem.data('item').name) || (!hoverCellItem.quantity)) {
							msgs.push({
								id: hoverCellItem.id,
								pos: this.hoverCell.index()
							});

							this.items.find(function (i) {
								return (i.id === hoverCellItem.id);
							}, this).pos = this.hoverCell.index();
						} else {
							method = 'combineStacks';
							msgs = {
								fromId: this.dragItem.data('item').id,
								toId: hoverCellItem.id
							};
						}
					}

					client.request({
						cpn: 'player',
						method: 'performAction',
						data: {
							cpn: 'inventory',
							method: method,
							data: msgs
						}
					});

					this.build();
				}

				this.dragItem = null;
				this.dragEl.remove();
				this.dragEl = null;
				this.hoverCell = null;
				this.find('.hover').removeClass('hover');
			}
		},

		onMouseMove: function (e) {
			if (!this.dragEl)
				return;

			let offset = this.find('.grid').offset();

			this.dragEl.css({
				left: e.clientX - offset.left - 40,
				top: e.clientY - offset.top - 40,
				display: 'block'
			});
		},

		onSortInventory: function () {
			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'inventory',
					method: 'sortInventory',
					data: {}
				}
			});	
		},

		showContext: function (item, e) {
			let menuItems = {
				drop: {
					text: 'drop',
					callback: this.performItemAction.bind(this, item, 'dropItem')
				},
				destroy: {
					text: 'destroy',
					callback: this.performItemAction.bind(this, item, 'destroyItem')
				},
				salvage: {
					text: 'salvage',
					callback: this.performItemAction.bind(this, item, 'salvageItem')
				},
				stash: {
					text: 'stash',
					callback: this.performItemAction.bind(this, item, 'stashItem')
				},
				learn: {
					text: 'learn',
					callback: this.performItemAction.bind(this, item, 'learnAbility')
				},
				quickSlot: {
					text: 'quickslot',
					callback: this.performItemAction.bind(this, item, 'setQuickSlot')
				},
				activate: {
					text: 'activate',
					callback: this.performItemAction.bind(this, item, 'activateMtx')
				},
				use: {
					text: 'use',
					callback: this.performItemAction.bind(this, item, 'useItem')
				},
				equip: {
					text: 'equip',
					callback: this.performItemAction.bind(this, item, 'equip')
				},
				augment: {
					text: 'craft',
					callback: this.openAugmentUi.bind(this, item)
				},
				mail: {
					text: 'mail',
					callback: this.openMailUi.bind(this, item)
				},
				split: {
					text: 'split stack',
					callback: this.splitStackStart.bind(this, item)
				},
				divider: '----------'
			};

			if (item.eq) {
				menuItems.learn.text = 'unlearn';
				menuItems.equip.text = 'unequip';
			}

			if (item.active)
				menuItems.activate.text = 'deactivate';

			let config = [];

			if (item.ability)
				config.push(menuItems.learn);
			else if (item.type === 'mtx')
				config.push(menuItems.activate);
			else if (item.type === 'toy' || item.type === 'consumable' || item.useText) {
				if (item.useText)
					menuItems.use.text = item.useText;
				config.push(menuItems.use);
				if (!item.has('quickSlot'))
					config.push(menuItems.quickSlot);
			} else if (item.slot) {
				config.push(menuItems.equip);
				if (!item.eq)
					config.push(menuItems.divider);

				if (!item.eq) {
					config.push(menuItems.augment);
					config.push(menuItems.divider);
				}
			}

			if ((!item.eq) && (!item.active)) {
				if (!item.quest) {
					if ((window.player.stash.active) && (!item.noStash))
						config.push(menuItems.stash);

					if (!item.noDrop)
						config.push(menuItems.drop);

					if ((!item.material) && (!item.noSalvage))
						config.push(menuItems.salvage);
				}

				if (!item.noDestroy)
					config.push(menuItems.destroy);
			}

			if (item.quantity > 1)
				config.push(menuItems.split);

			if ((!item.noDrop) && (!item.quest))
				config.push(menuItems.mail);

			if (isMobile)
				this.hideTooltip(null, this.hoverItem);

			if (config.length > 0)
				events.emit('onContextMenu', config, e);

			e.preventDefault();
			return false;
		},

		splitStackStart: function (item) {
			let box = this.find('.split-box').show();
			box.data('item', item);

			box.find('.amount')
				.val('1')
				.focus();
		},

		splitStackEnd: function (cancel, e) {
			let box = this.find('.split-box');

			if ((cancel) || (!e) || (e.target !== box.find('.btnSplit')[0])) {
				if ((cancel) && (!$(e.target).hasClass('btn')))
					box.hide();

				return;
			}

			box.hide();

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'inventory',
					method: 'splitStack',
					data: {
						itemId: box.data('item').id,
						stackSize: ~~this.find('.split-box .amount').val()
					}
				}
			});
		},

		onChangeStackAmount: function (e, amount) {
			let item = this.find('.split-box').data('item');
			let delta = amount;
			if (e)
				delta = (e.originalEvent.deltaY > 0) ? -1 : 1;
			if (input.isKeyDown('shift', true))
				delta *= 10;
			let elAmount = this.find('.split-box .amount');

			elAmount.val(Math.max(1, Math.min(item.quantity - 1, ~~elAmount.val() + delta)));
		},

		onEnterStackAmount: function (e) {
			let el = this.find('.split-box .amount');
			let val = el.val();
			if (+val !== ~~+val)
				el.val('');
			else if (val) {
				let item = this.find('.split-box').data('item');
				if (val < 0)
					val = '';
				else if (val > item.quantity - 1)
					val = item.quantity - 1;

				el.val(val);
			}
		},

		hideTooltip: function () {
			if (this.dragEl) {
				this.hoverCell = null;
				return;
			}

			events.emit('onHideItemTooltip', this.hoverItem);
			this.hoverItem = null;
		},
		onHover: function (el, item, e) {
			if (this.dragEl) {
				this.hoverCell = el;
				this.find('.hover').removeClass('hover');
				el.addClass('hover');
				return;
			}

			if (item)
				this.hoverItem = item;
			else
				item = this.hoverItem;

			if (!item)
				return;

			let ttPos = null;

			if (el) {
				if (el.hasClass('new')) {
					el.removeClass('new');
					el.find('.quantity').html((item.quantity > 1) ? item.quantity : '');
					delete item.isNew;
				}

				ttPos = {
					x: ~~(e.clientX + 32),
					y: ~~(e.clientY)
				};
			}

			events.emit('onShowItemTooltip', item, ttPos, true);
		},

		onGetItems: function (items, rerender) {
			this.items = items;

			if ((this.shown) && (rerender))
				this.build();
		},
		onDestroyItems: function (itemIds) {
			itemIds.forEach(function (id) {
				let item = this.items.find(i => i.id === id);
				if (item === this.hoverItem)
					this.hideTooltip();

				this.items.spliceWhere(i => i.id === id);
			}, this);

			if (this.shown)
				this.build();
		},

		toggle: function (show) {
			this.shown = !this.el.is(':visible');

			if (this.shown) {
				this.find('.split-box').hide();
				this.show();
				this.build();
			} else {
				this.hide();
				events.emit('onHideInventory');
				events.emit('onHideContextMenu');
			}

			this.hideTooltip();
		},

		beforeDestroy: function () {
			this.el.parent().css('background-color', 'transparent');
			this.el.parent().removeClass('blocking');
		},

		beforeHide: function () {
			if (this.oldSpellsZIndex) {
				$('.uiSpells').css('z-index', this.oldSpellsZIndex);
				this.oldSpellsZIndex = null;
			}
		},

		performItemAction: function (item, action) {
			if (!item)
				return;
			else if ((action === 'equip') && ((item.material) || (item.quest) || (item.type === 'mtx') || (!window.player.inventory.canEquipItem(item))))
				return;
			else if ((action === 'learnAbility') && (!window.player.inventory.canEquipItem(item)))
				return;
			else if ((action === 'activateMtx') && (item.type !== 'mtx'))
				return;

			let data = item.id;

			let cpn = 'inventory';
			if (['equip', 'setQuickSlot'].includes(action)) {
				cpn = 'equipment';

				if (action === 'setQuickSlot') {
					data = {
						itemId: item.id,
						slot: 0
					};
				}
			}

			if (action === 'useItem')
				this.hide();

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: cpn,
					method: action,
					data: data
				}
			});
		},

		openAugmentUi: function (item) {
			events.emit('onSetSmithItem', {
				item: item
			});
		},

		openMailUi: function (item) {
			events.emit('onSetMailItem', {
				item: item
			});
		},

		onKeyDown: function (key) {
			if (key === 'i')
				this.toggle();
			else if (key === 'shift' && this.hoverItem)
				this.onHover();
		},
		
		onKeyUp: function (key) {
			if (key === 'shift' && this.hoverItem)
				this.onHover();
		}
	};
});
