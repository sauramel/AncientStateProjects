const hpMult = 8;
const dmgMult = 1.5;

let balance = {
	hpMult: hpMult,
	dmgMult: dmgMult,

	mobs: {
		violetSerpent: {
			level: 20,
			hpMult: hpMult * 1,

			meleeDmg: 0.25,
			meleeCd: 5,
			meleeElement: null,
			slowDmg: 0.2,
			slowTtl: 20,
			slowCd: 50,
			slowChance: 0.5,
			slowElement: 'poison'
		},

		scarletSerpent: {
			level: 20,
			hpMult: hpMult * 1.25,

			meleeDmg: 0.25,
			meleeCd: 5,
			meleeElement: null,
			chargeDmg: 0.2,
			chargeCd: 25,
			chargeElement: null
		},

		viridianSerpent: {
			level: 20,
			hpMult: hpMult * 0.75,

			spitCd: 9,
			spitDmg: 0.12,
			spitDotDuration: 11,
			spitDotAmount: 20,
			spitElement: 'poison',
			poolDuration: 40,
			poolDmg: 5,
			poolElement: 'poison'
		}
	}
};

module.exports = {
	name: 'dungeon',
	level: [18, 20],

	mobs: {
		default: {
			faction: 'hostile',
			walkDistance: 0,
			grantRep: {
				gaekatla: 15
			},

			regular: {
				hpMult: balance.hpMult,
				dmgMult: balance.dmgMult,

				drops: {
					chance: 45,
					rolls: 1,
					magicFind: 500
				}
			},

			rare: {
				hpMult: balance.hpMult * 1.25,
				dmgMult: balance.dmgMult * 1.25,

				drops: {
					chance: 100,
					rolls: 1,
					magicFind: 2000
				}
			}
		},

		'violet serpent': {
			level: balance.mobs.violetSerpent.level,

			regular: {
				hpMult: balance.mobs.violetSerpent.hpMult
			},

			spells: [{
				type: 'melee',
				element: balance.mobs.violetSerpent.meleeElement,
				statMult: balance.mobs.violetSerpent.meleeDmg,
				cdMax: balance.mobs.violetSerpent.meleeCd
			}, {
				statMult: balance.mobs.violetSerpent.slowDmg,
				element: balance.mobs.violetSerpent.slowElement,
				cdMax: balance.mobs.violetSerpent.slowCd,
				type: 'projectile',
				row: 5,
				col: 4,
				applyEffect: {
					type: 'slowed',
					chance: balance.mobs.violetSerpent.slowChance,
					ttl: balance.mobs.violetSerpent.slowTtl
				},
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
		},

		'scarlet serpent': {
			level: balance.mobs.scarletSerpent.level,

			regular: {
				hpMult: balance.mobs.scarletSerpent.hpMult
			},

			spells: [{
				type: 'melee',
				element: balance.mobs.scarletSerpent.meleeElement,
				statMult: balance.mobs.scarletSerpent.meleeDmg,
				cdMax: balance.mobs.scarletSerpent.meleeCd
			}, {
				type: 'charge',
				targetFurthest: true,
				element: balance.mobs.scarletSerpent.chargeElement,
				stunDuration: 0,
				statMult: balance.mobs.scarletSerpent.chargeDmg,
				cdMax: balance.mobs.scarletSerpent.chargeCd
			}]
		},

		'viridian serpent': {
			level: balance.mobs.viridianSerpent.level,

			regular: {
				hpMult: balance.mobs.viridianSerpent.hpMult
			},

			spells: [{
				type: 'smokeBomb',
				element: balance.mobs.viridianSerpent.poolElement,
				castOnDeath: true,
				duration: balance.mobs.viridianSerpent.poolDuration,
				cdMult: balance.mobs.viridianSerpent.poolDmg
			}, {
				statMult: balance.mobs.viridianSerpent.spitDmg,
				element: balance.mobs.viridianSerpent.spitElement,
				cdMax: balance.mobs.viridianSerpent.spitCd,
				type: 'projectile',
				row: 5,
				col: 4,
				applyEffect: {
					type: 'lifeDrain',
					element: 'poison',
					ttl: balance.mobs.viridianSerpent.spitDotDuration,
					amount: balance.mobs.viridianSerpent.spitDotAmount
				},
				targetRandom: true,
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
		greencandle: {
			components: {
				cpnLight: {
					simplify: function () {
						return {
							type: 'light',
							blueprint: {
								color: {
									start: ['80f643'],
									end: ['4ac441', '51fc9a', 'd07840']
								},
								lifetime: {
									min: 2,
									max: 6
								}
							}
						};
					}
				}
			}
		}
	}
};
