define([
	'js/components/components',
	'js/rendering/renderer',
	'js/system/events',
	'js/config'
], function (
	components,
	renderer,
	events,
	config
) {
	return {
		components: [],
		offsetX: 0,
		offsetY: 0,
		eventCallbacks: {},

		addComponent: function (type, options) {
			let c = this[type];

			if ((!c) || (options.new)) {
				let template = components.getTemplate(type);
				if (!template)
					return;

				c = $.extend(true, {}, template);
				c.obj = this;

				for (let o in options) 
					c[o] = options[o];

				//Only use component to initialize other components?
				if ((c.init) && (c.init(options)))
					return null;

				this[c.type] = c;
				this.components.push(c);

				return c;
			} 
			if (c.extend)
				c.extend(options);

			return c;
		},

		removeComponent: function (type) {
			let cpn = this[type];
			if (!cpn)
				return;

			this.components.spliceWhere(function (c) {
				return (c === cpn);
			});

			delete this[type];
		},

		update: function () {
			let oComponents = this.components;
			let len = oComponents.length;
			for (let i = 0; i < len; i++) {
				let c = oComponents[i];
				if (c.update)
					c.update();

				if (c.destroyed) {
					if (c.destroy)
						c.destroy();

					oComponents.splice(i, 1);
					i--;
					len--;
					delete this[c.type];
				}
			}
		},

		on: function (eventName, callback) {
			let list = this.eventCallbacks[eventName] || (this.eventCallbacks[eventName] = []);
			list.push(events.on(eventName, callback));
		},

		setSpritePosition: function () {
			if (!this.sprite)
				return;

			this.sprite.x = (this.x * scale) + (this.flipX ? scale : 0) + this.offsetX;
			let oldY = this.sprite.x;
			this.sprite.y = (this.y * scale) + this.offsetY;

			if (this.sprite.width > scale) {
				if (this.flipX)
					this.sprite.x += scale;
				else
					this.sprite.x -= scale;

				this.sprite.y -= (scale * 2);
			}

			if (oldY !== this.sprite.y)
				renderer.reorder();

			this.sprite.scale.x = (this.flipX ? -scaleMult : scaleMult);

			['nameSprite', 'chatSprite'].forEach(function (s, i) {
				let sprite = this[s];
				if (!sprite)
					return;

				let yAdd = scale;
				if (i === 1) {
					yAdd *= -0.8;
					yAdd -= (this.chatter.msg.split('\r\n').length - 1) * scale * 0.8;
				}

				sprite.x = (this.x * scale) + (scale / 2) - (sprite.width / 2);
				sprite.y = (this.y * scale) + yAdd;
			}, this);

			if (this.stats)
				this.stats.updateHpSprite();
		},

		setVisible: function (visible) {
			if (this.sprite)
				this.sprite.visible = visible;

			if (this.nameSprite)
				this.nameSprite.visible = ((visible) && (config.showNames));

			this.components.forEach(function (c) {
				if (c.setVisible)
					c.setVisible(visible);
			});
		},

		destroy: function () {
			if (this.sprite)
				renderer.destroyObject(this);
			if (this.nameSprite) {
				renderer.destroyObject({
					layerName: 'effects',
					sprite: this.nameSprite
				});
			}

			let oComponents = this.components;
			let cLen = oComponents.length;
			for (let i = 0; i < cLen; i++) {
				let c = oComponents[i];
				if (c.destroy)
					c.destroy();
			}

			this.destroyed = true;

			this.offEvents();
		},

		offEvents: function () {
			if (this.pather)
				this.pather.onDeath();

			for (let e in this.eventCallbacks) {
				this.eventCallbacks[e].forEach(function (c) {
					events.off(e, c);
				}, this);
			}
		}
	};
});
