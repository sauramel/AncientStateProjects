module.exports = {
	name: 'estuary',
	level: [15, 18],
	addLevel: 0,
	resources: {},
	mobs: {
		default: {
			faction: 'hostile',
			grantRep: {
				gaekatla: 15
			},

			spells: [{
				type: 'melee',
				statMult: 0.1356,
				element: 'poison'
			}],

			regular: {
				hpMult: 4,
				dmgMult: 1.5,

				drops: {
					chance: 45,
					rolls: 1,
					magicFind: 500
				}
			},

			rare: {
				hpMult: 10,
				dmgMult: 2,

				drops: {
					chance: 100,
					rolls: 1,
					magicFind: 2000
				}
			}
		},
		'giant gull': {
			level: 15,
			questItem: {
				name: 'Gull Feather',
				sprite: [0, 0]
			}
		},
		'fanged rabbit': {
			level: 15
		},
		'ghastly toad': {
			level: 16
		},
		'overgrown beaver': {
			level: 16
		},
		'huge flamingo': {
			level: 17,
			questItem: {
				name: 'Flamingo Feather',
				sprite: [0, 0]
			}
		},
		'ironskull goat': {
			level: 18
		},
		"m'ogresh": {
			level: 20,
			grantRep: {
				gaekatla: 120
			},
			rare: {
				count: 0
			},
			regular: {
				hpMult: 10,
				dmgMult: 3,

				drops: {
					chance: 100,
					rolls: 3,
					magicFind: [2000, 125]
				}
			},
			spells: [{
				type: 'melee',
				range: 2,
				animation: 'basic'
			}, {
				type: 'warnBlast',
				range: 2,
				animation: 'basic',
				statMult: 0.01,
				particles: {
					color: {
						start: ['c0c3cf', '929398'],
						end: ['929398', 'c0c3cf']
					},
					scale: {
						start: {
							min: 4,
							max: 10
						},
						end: {
							min: 0,
							max: 4
						}
					},
					speed: {
						start: {
							min: 2,
							max: 16
						},
						end: {
							min: 0,
							max: 8
						}
					},
					lifetime: {
						min: 1,
						max: 1
					},
					spawnType: 'circle',
					spawnCircle: {
						x: 0,
						y: 0,
						r: 12
					},
					randomScale: true,
					randomSpeed: true,
					chance: 0.075,
					randomColor: true
				}
			}, {
				statMult: 0.2,
				type: 'projectile',
				row: 5,
				col: 4,
				shootAll: true,
				particles: {
					color: {
						start: ['a24eff', '7a3ad3'],
						end: ['7a3ad3', '533399']
					},
					scale: {
						start: {
							min: 2,
							max: 12
						},
						end: {
							min: 0,
							max: 6
						}
					},
					lifetime: {
						min: 2,
						max: 4
					},
					alpha: {
						start: 0.7,
						end: 0
					},
					speed: {
						start: {
							min: 4,
							max: 24
						},
						end: {
							min: 0,
							max: 12
						}
					},
					startRotation: {
						min: 0,
						max: 360
					},
					rotationSpeed: {
						min: 0,
						max: 360
					},
					randomScale: true,
					randomColor: true,
					randomSpeed: true,
					chance: 0.55,
					spawnType: 'circle',
					spawnCircle: {
						x: 0,
						y: 0,
						r: 8
					}
				}
			}]
		}
	},
	objects: {
		exit: {
			components: {
				cpnParticles: {
					simplify: function () {
						return {
							type: 'particles',
							blueprint: {
								color: {
									start: ['48edff', '80f643'],
									end: ['80f643', '48edff']
								},
								scale: {
									start: {
										min: 2,
										max: 10
									},
									end: {
										min: 0,
										max: 2
									}
								},
								speed: {
									start: {
										min: 4,
										max: 16
									},
									end: {
										min: 2,
										max: 8
									}
								},
								lifetime: {
									min: 1,
									max: 4
								},
								randomScale: true,
								randomSpeed: true,
								chance: 0.075,
								randomColor: true,
								spawnType: 'rect',
								spawnRect: {
									x: -32,
									y: -48,
									w: 64,
									h: 64
								}
							}
						};
					}
				}
			}
		}
	}
};
