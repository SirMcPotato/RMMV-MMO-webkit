var crypto = require('crypto');
var express = require('express');
var Account = require('../models/Account');
var router = express.Router();

/* GET users listing. */
router.get('/users/:username', function(req, res, next) {
	var user = req.session.user;
});

module.exports = router;
