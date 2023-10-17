var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');

const { connectToDb, getDb, fetchBooks}  = require('../database')

var router = express.Router();
let dbs;

connectToDb((err) => {
    if (!err) {
	dbs = getDb();
	console.log('connected to mongo');
    }
    else
	console.log("an error occured during connection")
})

router.get('/books', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, fetchBooks, function(req, res, next) {
  res.locals.filter = null;
  res.render('books', { user: req.user });
});

router.get('/login', function(req, res, next){
	res.render('login');
});

router.post('/login/password', passport.authenticate('local', {
	successRedirect: '/books',
	failureRedirect: '/login'
}));

router.post('/logout', function(req, res, next){
	req.logout(function(err){
		if (err) return next(err);
		res.redirect('/')
	});
});

router.get('/signup', function(req, res, next){
	res.render('signup');
});

router.post('/signup', function(req, res, next){
	var salt = crypto.randomBytes(16);
	crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword){
		if (err) return next(err);
		dbs.collection('accounts')
		.insertOne({name: req.body.username, password: hashedPassword, salt: Buffer.from(salt), date: new Date()})
			.then(function setup(currentUser) {
				//if (err) return next(err);
				var user = {
					id: currentUser.insertedId,
					username: req.body.username
				};
				req.login(user, function(err) {
					if(err) return next(err);
					res.redirect('/books');
				});
		})
	});
});

passport.serializeUser(function(user, cb){
	process.nextTick(function() {
		cb(null, {id: user.id, username: user.username})
	})
});

passport.deserializeUser(function(user, cb){
	process.nextTick(function() {
		cb(null, user);
	})
});
passport.use(new LocalStrategy(function verify(username, password, cb) {
	dbs.collection('accounts')
	.findOne({name: username})
	.then(function (user){
		crypto.pbkdf2(password, user.salt.buffer, 310000, 32, 'sha256', function(err, hashedPassword) {
			if (err) {cb(err)};
			if (!crypto.timingSafeEqual(user.password.buffer, hashedPassword))
				return cb(null, false, {message: 'Incorrect username or password.'});
			var user_passport = {
				id: user._id,
				username: user.name	
			};
			return cb(null, user_passport);
		})
	})
        .catch((err) =>{
	    return cb(err);
        })
}))
module.exports = router

