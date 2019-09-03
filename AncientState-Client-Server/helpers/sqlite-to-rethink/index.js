let sqlite = require('sqlite3').verbose();
let r = require('rethinkdb');
let util = require('util');

const config = {
	file: './storage.db',

	dbName: 'live',

	dropTables: true,

	maxBusy: 100,

	tables: [
		'characterList',
		'stash',
		'skins',
		'login',
		'leaderboard',
		'customMap',
		'mail',
		'customChannels',
		'error',
		'modLog',
		'accountInfo',
		'character'
	]
};

let converter = {
	dbS: null,
	dbR: null,

	connection: null,
	res: null,

	busy: 0,
	records: [],
	currentTable: null,

	init: async function () {
		this.dbS = new sqlite.Database(config.file, this.onDbCreated.bind(this));
	},

	onDbCreated: async function () {
		this.connection = await r.connect({
			host: 'localhost',
			port: 28015
		});

		await this.setupRethink();

		await this.convertTables();
	},

	setupRethink: async function () {
		try {
			await r.dbCreate(config.dbName).run(this.connection);
		} catch (e) {}

		await this.connection.use(config.dbName);

		for (const table of config.tables) {
			try {
				if (config.dropTables) {
					try {
						await r.tableDrop(table).run(this.connection);
					} catch (e) {}
				}
				await r.tableCreate(table).run(this.connection);
			} catch (e) {
				if (!e.msg.includes('already exists'))
					console.log(e);
			}
		}
	},

	convertTables: async function () {
		for (let table of config.tables) {
			this.currentTable = table;

			this.records = await util.promisify(this.dbS.all.bind(this.dbS))(`SELECT * FROM ${table}`);
			console.log(`${table}: ${this.records.length} records`);
			await this.startConvert();
			console.log('done');
		}
	},

	startConvert: async function () {
		return new Promise(res => {
			this.res = res;

			this.work();
		});
	},

	work: function () {
		if (!this.records.length) {
			this.res();
			return;
		}

		if (this.busy === config.maxBusy)
			return;

		let record = this.records.pop();
		if (record) {
			this.processRecord(record);
			this.work();
		}
	},

	processRecord: async function (record) {
		this.busy++;
		let id = record.key;
		let value = record.value
			.split('`')
			.join('\'');

		let obj = value;
		if (!['login'].includes(this.currentTable)) {
			if (this.currentTable === 'mail' && value === '')
				value = '{}';
			
			obj = JSON.parse(value);
		}

		await r.table(this.currentTable)
			.insert({
				id,
				value: obj
			})
			.run(this.connection);

		this.busy--;

		this.work();
	}
};

converter.init();
