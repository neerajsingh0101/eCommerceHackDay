var cfg = require('./vars'),
	express = require('express'),
	app = express.createServer(express.logger()),
	$ = require('seq'),
	redis = require('connect-redis')(express),
	redisStore = new redis(cfg.redisCfg),
	mysql = require('mysql');
	mysqlStore = mysql.createClient(cfg.mysqlCfg);

// App Definitions
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: "ehdpuzzle", store: redisStore, cookie: { maxAge: 1000 * 60 * 11 } })); // 11 minutes [failsafe]
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
	return res.send({success: false, message: "Method not implemented. Maybe you should try that endpoint with a POST type?"});	
});

app.post('/ImAHacker', function(req, res) {
	if(!req.session.startTime && req.body.action) {
		if(req.body.action == 'getCode') {
			// *************
			// 1st step - Success
			// *************
			req.session.startTime = new Date().getTime();
			req.session.step1 = true;

			return res.send({
				success: true,
				message: "Nice job, now let's get started! You'll have 10 minutes from now to complete this puzzle. After that, your session will expire, and you'll need to start over. To start, reply with your email address in the 'email' parameter."
			});
		} else {
			// *************
			// 1st step - Fail
			// *************			
			return res.send({
				success: false,
				message: "Not sure what I'm supposed to do..."
			});
		}
	}
	else if(!didExpire(req)) {
		var time = Math.floor((new Date().getTime() - req.session.startTime) / 1000) + ' seconds';

		if(req.session.step1 && req.body.email && !req.body.rsvp && !req.body.name) {
			// *************
			// 2nd step - Success
			// *************
			var validateEmail = function(email) {
			    // First check if any value was actually set
			    if (email.length == 0) return false;
			    // Now validate the email format using Regex
			    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
			    return re.test(email);
			}
			
			if(!validateEmail(req.body.email)) {
				return res.send({
					success: false,
					message: "That email looks funky. Let's try that again, please...",
					totalTime: time
				});
			} else {
				req.session.email = req.body.email;
				req.session.step2 = true;

				$()
					.seq(function() {
						var top = this;

						var query = mysqlStore.query(
							'INSERT INTO hackers (email, startTime, rsvp) '+
							'VALUES (?, ?, ?)',
							[req.session.email, new Date(req.session.startTime), 'no'],
							function(err, info) {
								req.session.mysqlId = info.insertId;
								top.ok();
							}
						);
					})
					.seq(function() {
						return res.send({
							success: true,
							message: "Awesome! Next, we'll need you to follow the directions in the 'instruction' parameter.",
							instruction: "RG8geW91IHdhbnQgdG8gdGFrZSBwYXJ0IGluIHRoZSBlQ29tbWVyY2UgaGFjayBkYXk/IFJlcGx5IHdpdGggJ3llcycvJ25vJyBpbiB0aGUgJ3JzdnAnIHBhcmFtZXRlci4==",
							totalTime: time
						});
					})
					.catch(function(err) {
						return res.send({
							success: false,
							message: "Oops. Something went wrong, but this totally isn't your fault. Please try this again later... If this keeps happening, email michael@dwolla.com.",
							error: err,
							totalTime: time
						});
					});
			}
		} else if(req.session.step1 && req.session.step2 && req.body.rsvp && !req.body.name) {
			// *************
			// 3rd step - Success
			// *************
			req.session.rsvp = req.body.rsvp;
			req.session.step3 = true;

			if(req.session.rsvp && req.session.rsvp.toLowerCase() == 'yes') {
				return res.send({
					success: true,
					message: "Great! One last thing, we're going to need your name to send you a ticket. Reply with your full name in the 'name' parameter.",
					totalTime: time
				});
			} else {
				$()
					.seq(function() {
						var top = this;
	
						if (req.session.mysqlId) {
							var query = mysqlStore.query(
								'UPDATE hackers '+
								'SET totalTime = ? ' + 
								'WHERE id = ?',
								[time, req.session.mysqlId],
								function() {
									top.ok();
								}
							);
						} else {
							top.ok();
						}
					})
					.seq(function() {
						return res.send({
							success: true,
							message: "Thanks for playing!",
							totalTime: time
						});
					})
					.catch(function(err) {
						return res.send({
							success: false,
							message: "Oops. Something went wrong, but this totally isn't your fault. Please try this again later... If this keeps happening, email michael@dwolla.com.",
							error: err,
							totalTime: time
						});
					});
			}
		} else if(req.session.step1 && req.session.step2 && req.session.step3 && req.body.name) {
			// *************
			// 4th step - Success
			// *************
			if(!req.body.name) {
				return res.send({
					success: false,
					message: "That name doesn't look right. Let's try that again, please...",
					totalTime: time
				});
			} else {
				req.session.name = req.body.name;
				req.session.step4 = true;
	
				$()
					.seq(function() {
						var	SendGrid = require('sendgrid').SendGrid,
							sendgrid = new SendGrid('schonfeld', 'Passw64!'),
							top = this;
	
						var htmlStr = "Someone solved our puzzle... Here's the person's info: <br/>";
						htmlStr += "<br/>";
						htmlStr += "Name: " + req.session.name + "<br/>";
						htmlStr += "Email: " + req.session.email + "<br/>";
						htmlStr += "RSVP?: " + req.session.rsvp + "<br/>";
						htmlStr += "Start Time: " + new Date(req.session.startTime) + "<br/>";
						htmlStr += "Total Time: " + time + "<br/>";
	
						sendgrid.send({
							to: ['michael@dwolla.com', 'alext@dwolla.com', 'nicole@dwolla.com', 'jordan@dwolla.com'],
							from: 'puzzle@ecommercehackday.com',
							fromName: 'EHD Puzzle',
							subject: "Someone solved the EHD puzzle.",
							html: htmlStr
						}, function(success, message) {
							top.ok();
						});
					})
					.seq(function() {
						var top = this;
	
						if (req.session.mysqlId) {
							var query = mysqlStore.query(
								'UPDATE hackers '+
								'SET name = ?, rsvp = ?, totalTime = ? ' + 
								'WHERE id = ?',
								[req.session.name, req.session.rsvp, time, req.session.mysqlId],
								function() {
									top.ok();
								}
							);
						} else {
							top.ok();
						}
					})
					.seq(function() {
						req.session.destroy();
	
						return res.send({
							success: true,
							message: "Thanks! If you we're in the first 200 to solve this puzzle, you'll receive your ticket soon. If not, you'll be automatically added to the waitlist. Talk soon!",
							totalTime: time
						});
					})
					.catch(function(err) {
						return res.send({
							success: false,
							message: "Oops. Something went wrong, but this totally isn't your fault. Please try this again later... If this keeps happening, email michael@dwolla.com.",
							error: err,
							totalTime: time
						});
					});
			}
		} else {
			// *************
			// 2nd / 3rd / 4th step - Fail
			// *************
			return res.send({
				success: false,
				message: "Something went wrong. Try again...",
				totalTime: time
			});
		}
	}
	else {
		// *************
		// Session expired
		// *************
		return res.send({success: false, message: 'Your session has expired. You should try refreshing the page, and restarting the puzzle.'});
	}
});



didExpire = function(req) {
	var maxTime = 1000 * 60 * 10, // 10 minutes
		now = new Date().getTime();
		
	if(!req.session.startTime) {
		return true;
	}

	if((now - req.session.startTime) > maxTime) {
		req.session.destroy();
		return true;
	}

	return false;
}