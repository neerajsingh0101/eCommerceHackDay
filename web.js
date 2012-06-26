var cfg = require('./vars'),
	express = require('express'),
	app = express.createServer(express.logger()),
	restler = require('restler');

// App Definitions
app.use(express.cookieParser());
app.use(express.session({ secret: 'secret' }));
app.use("/assets", express.static(__dirname + '/assets'));

// General error handling fn
var err = function(res, err) {
	console.log(err);
	return res.render('error.ejs', {err: err})
}

// Bind and start
app.listen(cfg.port, function() {
	console.log("Listening on " + cfg.port);
});

// **********************
// ROUTES
// **********************
app.get('/', function(req, res) {
	return res.render('index.ejs');
});

app.get('/ImAHacker', function(req, res) {
	if(!req.session) {
		// *************
		// 1st step
		// *************
		req.session.startTime = new Date().getTime();
	
		return res.send({
			success: true,
			message: "Nice job, now let's get started! You'll have 5 minutes from now to complete this puzzle. After that, your session will expire, and you'll need to start over. To start, reply with your full name in the 'name' parameter."
		});
	}
	else if(!didExpire(req)) {
		if(req.params.name) {
			// *************
			// 2nd step
			// *************
			
		}
	}
	else {
		// *************
		// Session expired
		// *************
		return res.send({success: false, message: 'Your session has expired.'});
	}
});



didExpire = function(req) {
	var maxTime = 1000 * 60 * 10, // 10 minutes
		now = new Date().getTime();

	if((now - req.session.startTime) > maxTime) {
		res.session.destroy();
		return true;
	}

	return false;
}