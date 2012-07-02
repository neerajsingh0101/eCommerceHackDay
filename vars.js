module.exports = {
	port: process.env.PORT || 3000,
	redisCfg: {
		host: 'cod.redistogo.com',
		port: 10029,
		db: 'schonfeld',
		pass: '4cb216e9a911250f1db4ecdca9b935f8',
		secret: 'ehdpuzzle'
	},
	mysqlCfg: {
		database: 'thepo568_ehd',
		user: 'thepo568_ehd',
		password: 'Passw64!',
		host: 'schonfeld.org',
		debug: false
	},
	sendgridCfg: {
		user: 'schonfeld',
		pass: 'Passw64!'
	}
};