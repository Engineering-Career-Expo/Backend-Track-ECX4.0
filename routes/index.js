var express = require('express');
var router = express.Router();
var  {fetchBooks} = require('../database');

/* GET home page. */
router.get('/', fetchBooks, function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, fetchBooks, function(req, res, next) {
  res.locals.filter = null;
  res.render('home', { user: req.user });
});
module.exports = router;
