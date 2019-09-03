module.exports = {
	hermit: {
		1: {
			msg: [{
				msg: 'What? Oh...what are you doing here?',
				options: [1.1, 1.2, 1.3, 1.4, 1.5]
			}],
			options: {
				1.1: {
					msg: 'Me? What are YOU doing in the middle of the wilderness?',
					goto: 2
				},
				1.2: {
					msg: 'My ship got wrecked, just south of here. I\'m stranded on this island.',
					goto: 3
				},
				1.3: {
					msg: 'Have you scavenged anything worth selling lately?',
					goto: 'tradeBuy'
				},
				1.4: {
					msg: 'I have some items you might be interested in.',
					goto: 'tradeSell'
				},
				1.5: {
					msg: 'I changed my mind, I want to buy something back.',
					goto: 'tradeBuyback'
				}
			}
		},
		2: {
			msg: 'I ran into some trouble in the city a few years ago. Moving out here seemed preferable to taking up residence in prison.',
			options: {
				2.1: {
					msg: 'Trouble? What kind of trouble?',
					goto: '2-1'
				},
				2.2: {
					msg: 'Where is the city?',
					goto: '2-2'
				},
				2.3: {
					msg: 'I\'d like to ask something else.',
					goto: 1
				}
			}
		},
		'2-1': {
			msg: 'Let\'s just say it was of a royal nature. There are those who would still like to see me in prison, or better yet; dead.',
			options: {
				'2-1.1': {
					msg: 'I\'d like to ask something else',
					goto: 2
				}
			}
		},
		'2-2': {
			msg: 'It\'s on the northern part of the island. Just don\'t let your tongue slip about my location.',
			options: {
				'2-2.1': {
					msg: 'I\'d like to ask something else',
					goto: 2
				}
			}
		},
		3: {
			msg: 'You mean you don\'t know where you are? Where are you from?',
			options: {
				3.1: {
					msg: 'I don\'t know. The developer hasn\'t written me a backstory yet.',
					goto: '3-1'
				},
				3.2: {
					msg: 'I\'d like to ask something else',
					goto: 2
				}
			}
		},
		'3-1': {
			msg: 'Typical...',
			options: {
				'3-1.1': {
					msg: 'I\'d like to ask something else',
					goto: 1
				}
			}
		},
		tradeBuy: {
			cpn: 'trade',
			method: 'startBuy',
			args: [{
				targetName: 'hermit'
			}]
		},
		tradeSell: {
			cpn: 'trade',
			method: 'startSell',
			args: [{
				targetName: 'hermit'
			}]
		},
		tradeBuyback: {
			cpn: 'trade',
			method: 'startBuyback',
			args: [{
				targetName: 'hermit'
			}]
		}
	},
	estrid: {
		1: {
			msg: [{
				msg: 'Is there anything I can help you with today?',
				options: [1.1, 1.3, 1.4, 1.5]
			}],
			options: {
				1.1: {
					msg: 'How long have you been working here?',
					goto: 2
				},
				1.3: {
					msg: 'I\'d like to browse your wares.',
					goto: 'tradeBuy'
				},
				1.4: {
					msg: 'I have some items to sell',
					goto: 'tradeSell'
				},
				1.5: {
					msg: 'I want to buy something back',
					goto: 'tradeBuyback'
				}
			}
		},
		2: {
			msg: 'I haven\'t been working here long, but I was born and raised here by my mother. She ran the shop before me.',
			options: {
				2.1: {
					msg: 'Where is your mother now?',
					goto: '2-1'
				},
				2.2: {
					msg: 'I\'d like to ask something else.',
					goto: 1
				}
			}
		},
		'2-1': {
			msg: 'A few months ago, she...took ill. She\'s been bedridden upstairs ever since.',
			options: {
				'2-1.1': {
					msg: 'I\'d like to ask something else.',
					goto: 1
				}
			}
		},
		tradeBuy: {
			cpn: 'trade',
			method: 'startBuy',
			args: [{
				targetName: 'estrid'
			}]
		},
		tradeSell: {
			cpn: 'trade',
			method: 'startSell',
			args: [{
				targetName: 'estrid'
			}]
		},
		tradeBuyback: {
			cpn: 'trade',
			method: 'startBuyback',
			args: [{
				targetName: 'estrid'
			}]
		}
	},
	vikar: {
		1: {
			msg: [{
				msg: 'Is there anything I can help you with today?',
				options: [1.1, 1.2, 1.3, 1.4]
			}],
			options: {
				1.1: {
					msg: 'I want to hand in some cards.',
					prereq: function (obj) {
						let fullSet = obj.inventory.items.find(i => ((i.setSize) && (i.setSize <= i.quantity)));
						return !!fullSet;
					},
					goto: 'tradeCards'
				},
				1.2: {
					msg: 'I would like to buy some runes',
					goto: 'tradeBuy'
				},
				1.3: {
					msg: 'I have some items I would like to sell',
					goto: 'tradeSell'
				},
				1.4: {
					msg: 'Could I see the items I sold to you?',
					goto: 'tradeBuyback'
				}
			}
		},
		tradeCards: {
			msg: [{
				msg: '',
				options: []
			}],
			method: function (obj) {
				let inventory = obj.inventory;
				let items = inventory.items;

				let sets = items.filter(function (i) {
					return (
						(i.type === 'Reward Card') &&
						(i.quantity >= i.setSize)
					);
				});

				if (sets.length === 0)
					return 'Sorry, you don\'t have any completed sets.';

				sets.forEach(function (s) {
					obj.instance.eventEmitter.emit('onGetCardSetReward', s.name, obj);
					inventory.destroyItem(s.id, s.setSize);
				});

				return 'Thank you.';
			}
		},
		tradeBuy: {
			cpn: 'trade',
			method: 'startBuy',
			args: [{
				targetName: 'vikar'
			}]
		},
		tradeSell: {
			cpn: 'trade',
			method: 'startSell',
			args: [{
				targetName: 'vikar'
			}]
		},
		tradeBuyback: {
			cpn: 'trade',
			method: 'startBuyback',
			args: [{
				targetName: 'vikar'
			}]
		}
	},
	priest: {
		1: {
			msg: [{
				msg: 'Is there anything I can help you with today?',
				options: [1.1, 1.2, 1.3]
			}],
			options: {
				1.1: {
					msg: 'I\'d like to browse your wares.',
					goto: 'tradeBuy'
				},
				1.2: {
					msg: 'I have some items to sell',
					goto: 'tradeSell'
				},
				1.3: {
					msg: 'I want to buy something back',
					goto: 'tradeBuyback'
				}
			}
		},
		tradeBuy: {
			cpn: 'trade',
			method: 'startBuy',
			args: [{
				targetName: 'priest'
			}]
		},
		tradeSell: {
			cpn: 'trade',
			method: 'startSell',
			args: [{
				targetName: 'priest'
			}]
		},
		tradeBuyback: {
			cpn: 'trade',
			method: 'startBuyback',
			args: [{
				targetName: 'priest'
			}]
		}
	}
};
