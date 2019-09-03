define([
	'js/misc/distanceToPolygon'
], function (
	distanceToPolygon
) {
	return {
		grid: null,

		width: 0,
		height: 0,

		init: function (collisionMap) {
			this.width = collisionMap.length;
			this.height = collisionMap[0].length;

			let grid = this.grid = _.get2dArray(this.width, this.height, false);
			for (let i = 0; i < this.width; i++) {
				let row = grid[i];
				let collisionRow = collisionMap[i];
				for (let j = 0; j < this.height; j++)
					row[j] = collisionRow[j];
			}
		},

		isTileBlocking: function (x, y, mob, obj) {
			if ((x < 0) || (y < 0) || (x >= this.width) | (y >= this.height))
				return true;

			x = ~~x;
			y = ~~y;

			return this.grid[x][y];
		},

		setCollision: function (config) {
			const x = config.x;
			const y = config.y;
			const collides = config.collides;

			this.grid[x][y] = collides;
		},

		isInPolygon: function (x, y, verts) {
			let inside = false;

			let vLen = verts.length;
			for (let i = 0, j = vLen - 1; i < vLen; j = i++) {
				let vi = verts[i];
				let vj = verts[j];

				let xi = vi[0];
				let yi = vi[1];
				let xj = vj[0];
				let yj = vj[1];

				let doesIntersect = (
					((yi > y) !== (yj > y)) &&
					(x < ((((xj - xi) * (y - yi)) / (yj - yi)) + xi))
				);

				if (doesIntersect)
					inside = !inside;
			}

			return inside;
		},

		distanceToPolygon: function (p, verts) {
			return distanceToPolygon.calculate(p, verts);
		}
	};
});
