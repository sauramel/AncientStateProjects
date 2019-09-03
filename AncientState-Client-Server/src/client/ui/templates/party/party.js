define([
	'js/system/events',
	'js/system/client',
	'js/system/globals',
	'js/objects/objects',
	'html!ui/templates/party/template',
	'css!ui/templates/party/styles',
	'html!ui/templates/party/templateInvite',
	'html!ui/templates/party/templatePartyMember'
], function (
	events,
	client,
	globals,
	objects,
	template,
	styles,
	templateInvite,
	templatePartyMember
) {
	return {
		tpl: template,

		invite: null,
		party: null,

		postRender: function () {
			this.onEvent('onGetInvite', this.onGetInvite.bind(this));
			this.onEvent('onGetParty', this.onGetParty.bind(this));
			this.onEvent('onPartyDisband', this.onPartyDisband.bind(this));

			this.onEvent('onGetConnectedPlayer', this.onGetConnectedPlayer.bind(this));

			this.onEvent('onGetPartyStats', this.onGetPartyStats.bind(this));
		},

		onGetConnectedPlayer: function (msg) {
			let party = this.party;
			if (!party)
				return;

			if (!(msg instanceof Array))
				msg = [msg];

			msg.forEach(function (m) {
				if (party.indexOf(m.id) === -1)
					return;

				let zone = m.zone;
				if (m.id === window.player.serverId) {
					party.forEach(function (p) {
						let player = globals.onlineList.find(function (o) {
							return (o.id === p);
						});

						let el = this.find('.member[memberId="' + p + '"]');
						el.removeClass('differentZone');

						if (player.zone !== zone)
							el.addClass('differentZone');
					}, this);
				} else {
					let el = this.find('.member[memberId="' + m.id + '"]');
					el.removeClass('differentZone');

					if (m.zone !== window.player.zone)
						el.addClass('differentZone');

					el.find('.txtLevel').html('level: ' + m.level);
				}
			}, this);
		},

		onGetPartyStats: function (id, stats) {
			let party = this.party;
			if (!party)
				return;

			let el = this.find('.member[memberId="' + id + '"]');
			if (el.length === 0)
				return;

			if ((stats.hp !== null) && (stats.hpMax !== null)) {
				let hpPercentage = Math.min(100, (stats.hp / stats.hpMax) * 100);
				el.find('.statHp').css('width', hpPercentage + '%');
			}

			if ((stats.mana !== null) && (stats.manaMax !== null)) {
				let manaPercentage = Math.min((stats.mana / stats.manaMax) * 100, 100);
				el.find('.statMana').css('width', manaPercentage + '%');
			}

			if (stats.level !== null) 
				el.find('.txtLevel').html('level: ' + stats.level);
		},

		onPartyDisband: function () {
			this.find('.party .list')
				.empty();
		},

		onGetParty: function (party) {
			// Destroy invite frame if you join a party
			if (this.invite)
				this.destroyInvite();

			let container = this.find('.party .list')
				.empty();

			this.party = party;
			if (!party)
				return;

			party.forEach(function (p) {
				if (p === window.player.serverId)
					return;

				let player = globals.onlineList.find(function (o) {
					return (o.id === p);
				});
				let playerName = player ? player.name : 'unknown';
				let level = 'level: ' + (player ? player.level : '?');

				let html = templatePartyMember
					.replace('$NAME$', playerName)
					.replace('$LEVEL$', level);

				let el = $(html)
					.appendTo(container)
					.attr('memberId', p)
					.on('contextmenu', this.showContext.bind(this, playerName, p));

				if (player.zone !== window.player.zone)
					el.addClass('differentZone');

				//Find stats
				let memberObj = objects.objects.find(function (o) {
					return (o.serverId === p);
				});
				if ((memberObj) && (memberObj.stats))
					this.onGetPartyStats(p, memberObj.stats.values);
			}, this);
		},

		showContext: function (charName, id, e) {
			events.emit('onContextMenu', [{
				text: 'whisper',
				callback: events.emit.bind(events, 'onDoWhisper', charName)
			}, {
				text: 'remove from party',
				callback: this.removeFromParty.bind(this, id)
			}, {
				text: 'leave party',
				callback: this.leaveParty.bind(this)
			}], e);

			e.preventDefault();
			return false;
		},

		onGetInvite: function (sourceId) {
			if (this.invite)
				this.destroyInvite();

			let sourcePlayer = globals.onlineList.find(function (o) {
				return (o.id === sourceId);
			});

			let html = templateInvite
				.replace('$NAME$', sourcePlayer.name);

			let el = $(html)
				.appendTo(this.el);
			el
				.find('[class^="btn"]')
				.on('click', this.destroyInvite.bind(this));

			this.invite = {
				fromId: sourcePlayer.id,
				fromName: sourcePlayer.name,
				el: el
			};
		},

		destroyInvite: function (e) {
			if (e) {
				if ($(e.target).hasClass('btnAccept'))
					this.acceptInvite();
				else
					this.declineInvite();
			}

			this.invite.el.remove();
			this.invite = null;

			events.emit('onUiHover', false);
		},

		acceptInvite: function () {
			client.request({
				cpn: 'social',
				method: 'acceptInvite',
				id: this.invite.fromId
			});
		},
		declineInvite: function () {
			client.request({
				cpn: 'social',
				method: 'declineInvite',
				id: this.invite.fromId,
				data: {
					targetId: window.player.serverId
				}
			});
		},

		removeFromParty: function (id) {
			client.request({
				cpn: 'social',
				method: 'removeFromParty',
				data: id
			});
		},
		leaveParty: function () {
			client.request({
				cpn: 'social',
				method: 'leaveParty'
			});
		}
	};
});
