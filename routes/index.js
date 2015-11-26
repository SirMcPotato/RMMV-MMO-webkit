var crypto = require('crypto');
var express = require('express');
var passport = require('passport');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();
var Account = require('../models/Account');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.post('/register', function(req, res) {
    //Check if email not already used
    Account.findByEmail(req.body.email, function(err, account){
        if (err) {
            return res.render('register', {
                pageData: {
                    err : err.message
                }
            });
        }
        if (account)
            return res.render('register', {
                pageData: {
                    err : "Email '"+account.email+"' already registered"
                }
            });

        //Create hash for activation code
        var shasum = crypto.createHash('sha1');
        shasum.update(req.body.username+req.body.email);
        actCode = shasum.digest('hex');

        //Hash the password a first time in sha1
        var shapwd = crypto.createHash('sha1').update(req.body.password + 'd28cb767c4272d8ab91000283c67747cb2ef7cd1').digest('hex');

        Account.register(new Account({
            username : req.body.username,
            email : req.body.email,
            activated : false,
            actCode: actCode,
            socketId: null,
            rank: 0
        }), shapwd, function(err, account) {
            if (err) {
                return res.render('register', {
                    pageData: {
                        err : err.message
                    }
                });
            }
            //TODO
            actUrl = 'http://www.myserver.com:3000/activate/'+actCode;

            transporter.sendMail({
                from: 'Team <no-reply@myserver.com>',
                to: req.body.email,
                subject: "RPGMaker MV MMO",
                text: "Hello "+req.body.username+' and welcome to RPGMaker MV MMO!\nYour account has been registrated, but you need to activate it by following this link :\n'+actUrl+'\n\nEnjoy!\n\t-- Vinxce',
                html: "Hello "+req.body.username+' and welcome to RPGMaker MV MMO!<br>Your account has been registrated, but you need to activate it by clicking on the following link : <br><a href="'+actUrl+'">'+actUrl+'</a><br>Enjoy!<br>-- Vinxce'
            })

            return res.render('register', {
                pageData: {
                    msg : 'An activation link has been send to your email address.'
                }
            });
            // passport.authenticate('local')(req, res, function () {
            //     res.redirect('/');
            // });
        });
    });
});

router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

router.post('/login', function(req, res, next){
    var reqcpy = req;
    reqcpy.body.password = crypto.createHash('sha1').update(req.body.password + 'd28cb767c4272d8ab91000283c67747cb2ef7cd1').digest('hex');
    passport.authenticate('local', function(err, user, info) {
        if (err)
            return next(err);
        
        if (!user)
            return res.render('login', {
                pageData: {
                    err: info.message
                }
            });

        if (!user.activated) {
            return res.render('login', {
                pageData: {
                    err: 'Account not activated'
                }
            });
        }

        req.logIn(user, function(err) {
            if (err) 
                return next(err);
            req.session.user = user;
            return res.redirect('/game');
        });
    })(reqcpy, res, next);
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/activate/:actCode', function(req, res) {
    var actCode = req.params.actCode;

    Account.activate(actCode, function(err, account){
        if (err) {
            return res.render('activation', {
                pageData: {
                    err: err.message
                }
            });
        }
        if (!account) {
            return res.render('activation', {
                pageData: {
                    err: "Can't activate account : Unknown token '<b>"+actCode+"</b>'."
                }
            });
        }
        return res.render('activation');
    });
});

module.exports = router;
