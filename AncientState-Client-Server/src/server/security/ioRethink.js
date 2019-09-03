let r = require('rethinkdb');
let serverConfig = require('../config/serverConfig');

const dbConfig = {
	host: serverConfig.dbHost,
	port: serverConfig.dbPort,
	db: 'live'
};

const tables = [
	'character',
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
	'accountInfo'
];

module.exports = {
	staticCon: null,

	init: async function (cbReady) {
		this.staticCon = await this.getConnection();

		await this.create();

		cbReady();
	},

	getConnection: async function () {
		return await r.connect(dbConfig);
	},

	create: async function () {
		const con = await this.getConnection();

		try {
			await r.dbCreate(this.useDb).run(con);
		} catch (e) {

		}

		for (const table of tables) {
			try {
				await r.tableCreate(table).run(con);
			} catch (e) {
				if (!e.message.includes('already exists'))
					_.log(e);
			}
		}

		con.close();
	},

	getAsync: async function ({
		table,
		key,
		isArray,
		noDefault
	}) {
		const con = await this.getConnection();

		let res = await r.table(table)
			.get(key)
			.run(con);

		if (res)
			return res.value;
		else if (isArray && !noDefault)
			return [];

		con.close();

		return res;
	},

	getAllAsync: async function ({
		table,
		key,
		isArray,
		noDefault
	}) {
		const con = await this.getConnection();

		let res = await r.table(table)
			.run(con);

		res = await res.toArray();

		if (res)
			return res;
		else if (isArray && !noDefault)
			return [];

		con.close();

		return res;
	},

	setAsync: async function ({
		table,
		key: id,
		value,
		conflict = 'update'
	}) {
		const con = await this.getConnection();

		await r.table(table)
			.insert({
				id,
				value
			}, {
				conflict
			})
			.run(con);

		con.close();
	},

	deleteAsync: async function ({
		key,
		table
	}) {
		const con = await this.getConnection();

		await r.table(table)
			.get(key)
			.delete()
			.run(con);

		con.close();
	},

	subscribe: function (table) {
		return r.table(table)
			.changes()
			.run(this.staticCon);
	},

	append: async function ({
		table,
		key,
		value,
		field
	}) {
		const con = await this.getConnection();

		await r.table(table)
			.get(key)
			.update(row => {
				return r.branch(
					row('value').typeOf().eq('ARRAY'),
					{
						[field]: row('value').setUnion(value)
					},
					{
						[field]: value
					}
				);
			})
			.run(con);

		con.close();
	},

	exists: async function ({
		table,
		key
	}) {
		const con = await this.getConnection();

		let res = await r.table(table)
			.get(key)
			.run(con);

		con.close();

		return !!res;
	}
};
