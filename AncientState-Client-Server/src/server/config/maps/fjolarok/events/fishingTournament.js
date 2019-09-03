module.exports = {
	name: 'Fishing Tournament',
	description: 'Catch the heaviest Ancient Carp for a chance to win Angler\'s Marks. Speak with Angler Nayla for more info.',
	distance: -1,
	cron: '0 19 * * *',

	notifications: [{
		mark: 0,
		msg: 'Angler Nayla: The Fishing Tournament begins in 10 minutes.',
		desc: 'Begins in 10 minutes.'
	}, {
		mark: 857,
		msg: 'Angler Nayla: The Fishing Tournament begins in 5 minutes.',
		desc: 'Begins in 5 minutes.'
	}, {
		mark: 1543,
		msg: 'Angler Nayla: The Fishing Tournament begins in 1 minute.',
		desc: 'Begins in 1 minute.'
	}, {
		mark: 1714,
		msg: 'Angler Nayla: The Fishing Tournament has begun!',
		desc: ''
	}, {
		mark: 2571,
		msg: 'Angler Nayla: The Fishing Tournament ends in 5 minutes.',
		desc: 'Ends in 5 minutes.'
	}, {
		mark: 3256,
		msg: 'Angler Nayla: The Fishing Tournament ends in 1 minute.',
		desc: 'Ends in 1 minute.'
	}, {
		mark: 3428,
		msg: 'Angler Nayla: The Fishing Tournament is over.'
	}],

	duration: 4285,
	prizeTime: 3428,

	descBase: 'Catch the heaviest Ancient Carp for a chance to win Angler\'s Marks. Speak with Angler Nayla for more info.',
	descLeaderboard: null,
	descTimer: null,

	events: {
		afterGiveRewards: function (events) {
			let event = events.getEvent('Fishing Tournament');
			event.descBase = 'The tournament has ended.';
			event.descLeaderboard = null;
			event.descTimer = null;

			events.setEventDescription('Fishing Tournament', this.description);
		},

		beforeSetDescription: function (events) {
			let event = events.getEvent('Fishing Tournament');

			event.description = event.descBase;
			if (event.descLeaderboard)
				event.description += '<br /><br />' + event.descLeaderboard;
			if (event.descTimer)
				event.description += '<br /><br />' + event.descTimer;
		}
	},

	helpers: {
		updateRewards: function (event, anglerNayla) {
			event.ranks = {};
			event.rewards = {};
			event.weights = {};

			let tempFish = anglerNayla.inventory.items
				.filter(i => (i.name.indexOf('Ancient Carp') > -1))
				.sort((a, b) => (b.stats.weight - a.stats.weight));

			let fish = [];
			tempFish.forEach(function (t) {
				if (!fish.some(f => (f.owner === t.owner)))
					fish.push(t);
			});

			let rewardCounts = [35, 20, 10];
			let tpl = {
				name: 'Angler\'s Mark',
				sprite: [12, 9],
				noDrop: true,
				noDestroy: true,
				noSalvage: true
			};
			let consolationQty = 2;

			let rank = 0;
			let lastWeight = fish[0].stats.weight;
			for (let i = 0; i < fish.length; i++) {
				let f = fish[i];
				if (event.rewards[f.owner])
					continue;

				if (f.stats.weight < lastWeight) {
					lastWeight = f.stats.weight;
					rank++;
				}

				event.ranks[f.owner] = rank + 1;
				event.weights[f.owner] = f.stats.weight;

				let rewardQty = rewardCounts[rank] || consolationQty;

				event.rewards[f.owner] = [extend({
					quantity: rewardQty
				}, tpl)];
			}
		},

		updateDescription: function (event, events) {
			let ranks = event.ranks;
			let weights = event.weights;

			let desc = 'Leaderboard:<br />';
			for (let playerName in ranks) 
				desc += `${ranks[playerName]}: ${playerName} (${weights[playerName]}) <br />`;
			
			desc = desc.substr(0, desc.length - 6);

			event.config.descLeaderboard = desc;
			events.setEventDescription('Fishing Tournament');
		},

		updateWinText: function (event, events) {
			let ranks = event.ranks;

			let winText = 'Angler Nayla: ';
			let winners = Object.keys(ranks).filter(r => (ranks[r] === 1));
			let wLen = winners.length;
			winners.forEach(function (w, i) {
				winText += ((wLen > 1) && (i === wLen - 1)) ? `and ${w} ` : `${w} `;
			});

			winText += 'won!';

			events.setWinText('Fishing Tournament', winText);
		},

		giveFish: function (source, target) {
			let srcInventory = source.inventory;
			let tgtInventory = target.inventory;

			srcInventory.items
				.filter(i => (i.name.indexOf('Ancient Carp') > -1))
				.sort((a, b) => (b.stats.weight - a.stats.weight))
				.forEach(function (f, i) {
					if (i === 0) {
						f.owner = source.name;
						tgtInventory.getItem(extend({}, f));
					}

					srcInventory.destroyItem(f.id);
				});
		},

		getRank: function (event, playerName) {
			let ranks = event.ranks;
			if (!ranks)
				return -1;

			return (ranks[playerName] || -1);
		}
	},

	phases: [{
		type: 'spawnMob',
		endMark: 1714,
		mobs: {
			name: 'Angler Nayla',
			attackable: false,
			level: 20,
			cell: 69,
			id: 'anglerNayla',
			hpMult: 1,
			pos: {
				x: 140,
				y: 46
			},
			dialogue: {
				auto: true,
				config: {
					1: {
						msg: [{
							msg: 'Hi there, are you here to compete?',
							options: [1.1, 1.2, 1.3]
						}],
						options: {
							1.1: {
								msg: 'What\'s happening here?',
								goto: 2
							},
							1.2: {
								msg: 'Could I please have a Competition Rod?',
								goto: 5
							},
							1.3: {
								msg: 'I would like to trade some Angler\'s Marks.',
								goto: 'tradeBuy'
							}
						}
					},
					2: {
						msg: 'Why, the Grand Fishing Tournament, of course! Anglers come from all over to compete in this esteemed event.',
						options: {
							2.1: {
								msg: 'How does it work?',
								goto: 3
							}
						}
					},
					3: {
						msg: 'Simply catch fish during the tournament. If you\'re lucky, you\'ll catch an Ancient Carp. Bring them to me and if you catch the heaviest one, you win!',
						options: {
							3.1: {
								msg: 'What are the prizes?',
								goto: 4
							}
						}
					},
					4: {
						msg: 'The top three participants will win Angler\'s Marks that can be exchanged for Fishing Rods and Cerulean Pearls.',
						options: {
							4.1: {
								msg: 'I would like to ask something else.',
								goto: 1
							}
						}
					},
					5: {
						msg: [{
							msg: '',
							options: [1.1, 1.2, 1.3, 1.4]
						}],
						cpn: 'dialogue',
						method: 'getItem',
						args: [{
							item: {
								name: 'Competition Rod',
								slot: 'tool',
								sprite: [11, 1],
								type: 'Fishing Rod',
								worth: 0,
								noSalvage: true,
								noAugment: true,
								stats: {
									catchSpeed: 50,
									catchChance: 25
								}
							},
							successMsg: 'May it cast true.',
							existsMsg: 'Oh, it seems that you already have one.'
						}]
					},
					tradeBuy: {
						cpn: 'trade',
						method: 'startBuy',
						args: [{
							targetName: 'angler nayla'
						}]
					}
				}
			},
			trade: {
				items: {
					min: 0,
					max: 0
				},
				forceItems: [{
					name: 'Cerulean Pearl',
					material: true,
					sprite: [11, 9],
					infinite: true,
					quality: 3,
					worth: {
						currency: 'Angler\'s Mark',
						amount: 4
					}
				}, {
					name: 'Common Fishing Rod',
					type: 'Fishing Rod',
					slot: 'tool',
					quality: 0,
					worth: {
						currency: 'Angler\'s Mark',
						amount: 5
					},
					sprite: [11, 0],
					infinite: true,
					stats: {
						stats: '???'
					}
				}, {
					name: 'Magic Fishing Rod',
					type: 'Fishing Rod',
					slot: 'tool',
					quality: 1,
					worth: {
						currency: 'Angler\'s Mark',
						amount: 15
					},
					sprite: [11, 0],
					infinite: true,
					stats: {
						stats: '???'
					}
				}, {
					name: 'Rare Fishing Rod',
					type: 'Fishing Rod',
					slot: 'tool',
					quality: 2,
					worth: {
						currency: 'Angler\'s Mark',
						amount: 45
					},
					sprite: [11, 0],
					infinite: true,
					stats: {
						stats: '???'
					}
				}],
				faction: {
					id: 'anglers'
				},
				level: {
					min: 1,
					max: 5
				},
				markup: {
					buy: 0.25,
					sell: 2.5
				}
			}
		}
	}, {
		type: 'hookEvents',
		endMark: 3428,
		auto: true,
		events: {
			beforeGatherResource: function (gatherResult, gatherer) {
				if (gatherResult.nodeType !== 'fish')
					return;

				let hasCompRod = gatherer.inventory.items.some(i => ((i.name === 'Competition Rod') && (i.eq)));
				if (!hasCompRod)
					return;

				gatherResult.items.forEach(function (g) {
					extend(g, {
						name: 'Ancient Carp',
						sprite: [11, 4],
						noDrop: true,
						worth: 0
					});
				});
			},

			beforeEnterPool: function (gatherResult, gatherer) {
				if (gatherResult.nodeName === 'Sun Carp')
					gatherResult.nodeName = 'Ancient Carp';
			}
		}
	}, {
		type: 'modifyDialogue',
		endMark: 3428,
		mobId: 'anglerNayla',
		dialogue: {
			add: {
				1: {
					1.4: {
						msg: 'I\'d like to hand in some fish.',
						prereq: function (obj) {
							let fishies = obj.inventory.items.find(i => (i.name.indexOf('Ancient Carp') > -1));
							return !!fishies;
						},
						goto: 'giveFish'
					}
				},
				giveFish: {
					msg: [{
						msg: '',
						options: [1.1, 1.2, 1.3, 1.4]
					}],
					method: function (obj) {
						let eventConfig = this.instance.events.getEvent('Fishing Tournament');
						if (!eventConfig)
							return;

						let helpers = eventConfig.helpers;
						let event = eventConfig.event;

						let oldRank = helpers.getRank(event, obj.name);

						helpers.giveFish(obj, this);
						helpers.updateRewards(event, this);

						let newRank = helpers.getRank(event, obj.name);
						helpers.updateDescription(event, this.instance.events);

						if (oldRank !== newRank) {
							helpers.updateWinText(event, this.instance.events);

							return {
								1: 'Wow, that one\'s huge. You took first place!',
								2: 'Nice catch. You took second place!',
								3: 'Not bad at all. You took third place!'
							}[newRank];
						} else if (newRank === 1)
							return 'Great, you\'re still in first place!';
						return 'Not quite heavy enough, keep trying!';
					}
				}
			}
		}
	}, {
		type: 'modifyDialogue',
		mobId: 'anglerNayla',
		dialogue: {
			remove: {
				1: {
					1.4: null
				},
				giveFish: null
			}
		}
	}]
};
