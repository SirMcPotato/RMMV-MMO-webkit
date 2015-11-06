var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var http = require('http');

var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var Account = require('./models/Account');

var app = express();

var secretCat = 'ThisCatIsNowASecretToken=w=';

var sessionMiddleware = session({
    name: "RMMVEXPSID",
    secret: secretCat,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    }),
    resave: true,
    saveUninitialized: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// Configure passport-local to use account model for authentication
passport.use(new LocalStrategy(Account.authenticate()));

passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// Configure passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect mongoose
mongoose.connect('mongodb://localhost/RMMV_MMO', function(err) {
    if (err) {
        console.log('Could not connect to mongodb on localhost. Ensure that you have mongodb running on localhost and mongodb accepts connections on standard ports!');
    }
});


app.use(sessionMiddleware);

// Register routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/users'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.server = http.createServer(app);

var GameServer = require('./GameServer.js')(app, sessionMiddleware);


module.exports = app;