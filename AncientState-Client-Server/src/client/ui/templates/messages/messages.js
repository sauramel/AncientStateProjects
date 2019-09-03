define([
	'js/system/events',
	'html!ui/templates/messages/template',
	'html!ui/templates/messages/tplTab',
	'css!ui/templates/messages/styles',
	'js/input',
	'js/system/client'
], function (
	events,
	template,
	tplTab,
	styles,
	input,
	client
) {
	return {
		tpl: template,

		currentFilter: 'info',

		messages: [],
		maxTtl: 500,

		maxChatLength: 255,

		hoverItem: null,

		hoverFilter: false,

		blockedPlayers: [],

		postRender: function () {
			this.onEvent('onGetMessages', this.onGetMessages.bind(this));
			this.onEvent('onDoWhisper', this.onDoWhisper.bind(this));
			this.onEvent('onJoinChannel', this.onJoinChannel.bind(this));
			this.onEvent('onLeaveChannel', this.onLeaveChannel.bind(this));
			this.onEvent('onGetCustomChatChannels', this.onGetCustomChatChannels.bind(this));
			this.onEvent('onGetBlockedPlayers', this.onGetBlockedPlayers.bind(this));

			this
				.find('.filter:not(.channel):not(.btn)')
				.on('mouseover', this.onFilterHover.bind(this, true))
				.on('mouseleave', this.onFilterHover.bind(this, false))
				.on('click', this.onClickFilter.bind(this));

			if (isMobile) {
				this.kbUpper = 0;

				this.el.on('click', this.toggle.bind(this, true));
				this.renderKeyboard();

				$(tplTab)
					.appendTo(this.find('.filters'))
					.addClass('btnClose')
					.html('x')
					.on('click', this.toggle.bind(this, false, true));
			} else {
				this.find('input')
					.on('keydown', this.sendChat.bind(this))
					.on('input', this.checkChatLength.bind(this))
					.on('blur', this.toggle.bind(this, false, true));
			}

			this.onEvent('onKeyDown', this.onKeyDown.bind(this));
			this.onEvent('onKeyUp', this.onKeyUp.bind(this));
		},

		update: function () {
			if (isMobile)
				return;
			
			if (this.el.hasClass('typing'))
				return;

			const time = new Date();
			let elTime = this.find('.time');
			const timeString = (
				'[ ' + 
				time.getUTCHours().toString().padStart(2, 0) + 
				':' + 
				time.getUTCMinutes().toString().padStart(2, 0) + 
				' ]'
			);
			if (elTime.html() !== timeString)
				elTime.html(timeString);
		},

		renderKeyboard: function () {
			this.find('.keyboard').remove();

			let container = $('<div class="keyboard"></div>')
				.appendTo(this.el);

			let controls = ['|', 'caps', 'space', 'backspace', 'enter'];

			let keyboard = {
				0: '1234567890|qwertyuiop|asdfghjkl|zxcvbnm',
				1: '!@#$%^&*()|QWERTYUIOP|ASDFGHJKL|ZXCVBNM',
				2: '!@#$%^&*()|     {}[]\\|`-=_+;\':"|~,./<>?'
			}[this.kbUpper].split('').concat(controls);

			keyboard
				.forEach(k => {
					if (k === '|') {
						$('<div class="newline"></div>')
							.appendTo(container);

						return;	
					}

					let className = (k.match(/[a-z]/i) || k.length > 1) ? 'key' : 'key special';
					if (k === ' ') {
						k = '.';
						className = 'key hidden';
					}

					className += ' ' + k;

					let elKey = $(`<div class="${className}">${k}</div>`)
						.appendTo(container);

					if (!className.includes('hidden')) 	
						elKey.on('click', this.clickKey.bind(this, k));
				});
		},

		clickKey: function (key) {
			window.navigator.vibrate(20);

			let elInput = this.find('input');

			const handler = {
				caps: () => {
					this.kbUpper = (this.kbUpper + 1) % 3;
					this.renderKeyboard();
				},

				space: () => {
					this.clickKey(' ');
				},

				backspace: () => {
					elInput.val(elInput.val().slice(0, -1));
					this.find('.input').html(elInput.val());
				},

				enter: () => {
					this.sendChat({
						which: 13
					});
					this.find('.input').html('');
					this.find('input').val('');
				}
			}[key];
			if (handler) {
				handler();
				return;
			}

			elInput.val(elInput.val() + key);
			this.checkChatLength();

			this.find('.input').html(elInput.val());
		},

		checkChatLength: function () {
			let textbox = this.find('input');
			let val = textbox.val();

			if (val.length <= this.maxChatLength)
				return;

			val = val.substr(0, this.maxChatLength);
			textbox.val(val);
		},

		onGetBlockedPlayers: function (list) {
			this.blockedPlayers = list;
		},

		onGetCustomChatChannels: function (channels) {
			channels.forEach(function (c) {
				this.onJoinChannel(c);
			}, this);
		},

		onJoinChannel: function (channel) {
			this.find('[filter="' + channel.trim() + '"]').remove();

			let container = this.find('.filters');
			$(tplTab)
				.appendTo(container)
				.addClass('channel')
				.attr('filter', channel.trim())
				.html(channel.trim())
				.on('mouseover', this.onFilterHover.bind(this, true))
				.on('mouseleave', this.onFilterHover.bind(this, false))
				.on('click', this.onClickFilter.bind(this));
		},

		onLeaveChannel: function (channel) {
			this.find('.filters [filter="' + channel + '"]').remove();
		},

		onFilterHover: function (hover) {
			this.hoverFilter = hover;
		},

		onClickFilter: function (e) {
			let el = $(e.target);
			el.toggleClass('active');

			let filter = el.attr('filter');
			let method = (el.hasClass('active') ? 'show' : 'hide');

			if (method === 'show')
				this.find('.list').addClass(filter);
			else
				this.find('.list').removeClass(filter);

			if (el.hasClass('channel')) 
				this.find('.list .' + filter)[method]();
		},

		onKeyDown: function (key) {
			if (key === 'enter')
				this.toggle(true);
			else if (key === 'shift')
				this.showItemTooltip();
		},

		onKeyUp: function (key) {
			if (key === 'shift')
				this.showItemTooltip();
		},

		onDoWhisper: function (charName) {
			this.toggle(true);
			let toName = charName;
			if (charName.indexOf(' ') > -1)
				toName = "'" + toName + "'";

			this.find('input').val('@' + toName + ' ');
		},

		onGetMessages: function (e) {
			let messages = e.messages;
			if (!messages.length)
				messages = [messages];

			let container = this.find('.list');

			messages.forEach(m => {
				let message = m.message;

				if (m.source && this.blockedPlayers.includes(m.source))
					return;

				if (m.item) {
					let source = message.split(':')[0];
					message = source + ': <span class="q' + (m.item.quality || 0) + '">' + message.replace(source + ': ', '') + '</span>';
				}

				let el = $('<div class="list-message ' + m.class + '">' + message + '</div>')
					.appendTo(container);

				if (m.has('type'))
					el.addClass(m.type);
				else
					el.addClass('info');

				if (m.item) {
					el.find('span')
						.on('mousemove', this.showItemTooltip.bind(this, el, m.item))
						.on('mouseleave', this.hideItemTooltip.bind(this));
				}

				if (m.type) {
					let isChannel = (['info', 'chat', 'loot', 'rep'].indexOf(m.type) === -1);
					if (isChannel) {
						if (this.find('.filter[filter="' + m.type + '"]').hasClass('active'))
							el.show();
					}

					if (isMobile && m.type === 'loot') {
						events.emit('onGetAnnouncement', {
							msg: m.message
						});
					}
				}

				this.messages.push({
					ttl: this.maxTtl,
					el: el
				});
			});

			if (!this.el.hasClass('typing'))
				container.scrollTop(9999999);
		},

		hideItemTooltip: function () {
			if (this.dragEl) {
				this.hoverCell = null;
				return;
			}

			events.emit('onHideItemTooltip', this.hoverItem);
			this.hoverItem = null;
		},

		showItemTooltip: function (el, item, e) {
			if (item)
				this.hoverItem = item;
			else
				item = this.hoverItem;

			if (!item)
				return;

			let ttPos = null;
			if (el) {
				ttPos = {
					x: ~~(e.clientX + 32),
					y: ~~(e.clientY)
				};
			}

			events.emit('onShowItemTooltip', item, ttPos, true, true);
		},

		toggle: function (show, isFake, e) {
			if ((isFake) && (this.hoverFilter))
				return;

			input.resetKeys();

			this.el.removeClass('typing');

			let textbox = this.find('input');

			if (show) {
				this.el.addClass('typing');
				textbox.focus();
				this.find('.list').scrollTop(9999999);
			} else 
				textbox.val('');

			if (e)
				e.stopPropagation();
		},

		sendChat: function (e) {
			if (e.which === 27) {
				this.toggle(false);
				return;
			} else if (e.which === 9) {
				e.preventDefault();
				let textfield = this.find('input');
				textfield.val(`${textfield.val()}    `);
				return;
			} else if (e.which !== 13)
				return; 

			if (!this.el.hasClass('typing')) {
				this.toggle(true);
				return;
			}

			let textbox = this.find('input');
			let val = textbox.val()
				.split('<')
				.join('&lt;')
				.split('>')
				.join('&gt;');

			textbox.blur();

			if (val.trim() === '')
				return;

			client.request({
				cpn: 'social',
				method: 'chat',
				data: {
					message: val
				}
			});
		}
	};
});
