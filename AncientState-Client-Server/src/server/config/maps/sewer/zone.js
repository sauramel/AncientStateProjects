module.exports = {
	name: 'Sewer',
	level: [11, 13],

	mobs: {
		default: {
			faction: 'fjolgard',
			deathRep: -5
		},

		rat: {
			faction: 'fjolgard',
			grantRep: {
				fjolgard: 6
			},
			level: 11,

			regular: {
				drops: {
					rolls: 1,
					noRandom: true,
					alsoRandom: true,
					blueprints: [{
						chance: 2,
						type: 'key',
						noSalvage: true,
						name: 'Rusted Key',
						keyId: 'rustedSewer',
						singleUse: true,
						sprite: [12, 1],
						quantity: 1
					}]
				}
			},

			rare: {
				count: 0
			}
		},

		stinktooth: {
			faction: 'fjolgard',
			grantRep: {
				fjolgard: 15
			},
			level: 13,

			regular: {
				drops: {
					rolls: 1,
					noRandom: true,
					alsoRandom: true,
					blueprints: [{
						chance: 0.5,
						type: 'key',
						noSalvage: true,
						name: 'Rusted Key',
						keyId: 'rustedSewer',
						singleUse: true,
						sprite: [12, 1],
						quantity: 1
					}]
				}
			},

			rare: {
				chance: 4,
				name: 'Steelclaw',
				cell: 59
			}
		},

		bandit: {
			faction: 'hostile',
			grantRep: {
				fjolgard: 18
			},
			level: 11,

			rare: {
				count: 0
			}
		},

		whiskers: {
			level: 13,
			faction: 'hostile',
			grantRep: {
				fjolgard: 22
			},

			rare: {
				count: 0
			}
		},

		'bera the blade': {
			faction: 'hostile',
			grantRep: {
				fjolgard: 25
			},
			level: 14,

			regular: {
				drops: {
					rolls: 1,
					noRandom: true,
					alsoRandom: true,
					blueprints: [{
						chance: 100,
						type: 'key',
						noSalvage: true,
						name: 'Rusted Key',
						keyId: 'rustedSewer',
						singleUse: true,
						sprite: [12, 1],
						quantity: 1
					}]
				}
			},

			rare: {
				count: 0
			}
		}
	},
	objects: {
		sewerdoor: {
			properties: {
				cpnDoor: {
					autoClose: 171,
					locked: true,
					key: 'rustedSewer',
					destroyKey: true
				}
			}
		},
		banditdoor: {
			properties: {
				cpnDoor: {}
			}
		},
		vaultdoor: {
			properties: {
				cpnDoor: {}
			}
		},

		treasure: {
			cron: '0 2 * * *'
		}
	}
};
