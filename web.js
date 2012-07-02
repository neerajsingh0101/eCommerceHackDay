var cfg = require('./vars'),
	express = require('express'),
	app = express.createServer(express.logger()),
	$ = require('seq'),
	redis = require('connect-redis')(express),
	redisStore = new redis(cfg.redisCfg),
	mysql = require('mysql');
	mysqlStore = mysql.createClient(cfg.mysqlCfg);

// **********************
// APP DEFINITIONS
// **********************
app.configure(function() {
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({
		secret: cfg.redisCfg.secret,
		store: redisStore,
		cookie: {
			maxAge: 1000 * 60 * 11  // 11 minutes [failsafe]
		}
	}));
	app.use("/assets", express.static(__dirname + '/assets'));
});

// **********************
// ROUTES
// **********************
require('./routes')(app, cfg);

// **********************
// BIND & START
// **********************
app.listen(cfg.port, function() {
	console.log("Listening on " + cfg.port);
});
