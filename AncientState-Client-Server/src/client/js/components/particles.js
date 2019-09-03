define([
	'js/rendering/renderer'
], function (
	renderer
) {
	return {
		type: 'particles',
		emitter: null,

		init: function (blueprint) {
			this.blueprint = this.blueprint || {};
			this.blueprint.pos = {
				x: (this.obj.x * scale) + (scale / 2),
				y: (this.obj.y * scale) + (scale / 2)
			};
			this.ttl = blueprint.ttl;
			this.blueprint.obj = this.obj;

			this.emitter = renderer.buildEmitter(this.blueprint);
		},

		setVisible: function (visible) {
			//Sometimes, we make emitters stop emitting for a reason
			// for example, when an explosion stops
			if (!this.emitter.disabled)
				this.emitter.emit = visible;
		},

		update: function () {
			if (this.ttl !== null) {
				this.ttl--;
				if (this.ttl <= 0) {
					if (this.destroyObject)
						this.obj.destroyed = true;
					else
						this.destroyed = true;
					return;
				}
			}

			if (!this.emitter.emit)
				return;

			this.emitter.spawnPos.x = (this.obj.x * scale) + (scale / 2);
			this.emitter.spawnPos.y = (this.obj.y * scale) + (scale / 2);
		},

		destroy: function () {
			renderer.destroyEmitter(this.emitter);
		}
	};
});
