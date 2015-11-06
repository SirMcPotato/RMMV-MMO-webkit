var crypto = require('crypto');
var express = require('express');
var Account = require('../models/Account');
var router = express.Router();

/* GET users listing. */
router.get('/users/:username', function(req, res, next) {
	var user = req.session.user;
	crypto.pbkdf2('jk.asoaa', user.salt, 25000, 512, function(err, hashRaw){
		res.render('dashboard', {
			test: new Buffer(hashRaw, 'binary').toString('hex'),
			user: user
		});
	});
});

module.exports = router;
