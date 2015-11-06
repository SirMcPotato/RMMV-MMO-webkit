/* 
* @Author: Vinxce
* @Date:   2015-10-27 08:05:27
* @Last Modified by:   Vinxce
* @Last Modified time: 2015-11-06 02:31:35
*/

var crypto = require('crypto');
var Account = require('./models/Account');

var handshakePrivateSeed = "c2aaf41755945b640071dd13342923331d004ae4";
var handshakePublicSeed = "331e32c90d6f17b50f3070369aa58d902d379c50";

var clientVersion = "1.0.1a";

var io = null;

function isHandshakedSession(socket, noerr, noclose) {
	if (!socket.request.session.handshakeOk) {
		if (!noerr) {
			socket.emit('mmo_error', {
				code: 2,
				msg: "Session not handshaked"
			});
		}
		if (!noclose) {
			socket.disconnect('Session not handshaked');
		}
		return false;
	}
	return true;
}


function bindHandshakeEvents(socket) {
	socket.on('handshakeResult', function(data){
		if (data.clientVersion != clientVersion) {
			socket.emit('mmo_error', {
				code: 4,
				msg: "Invalid game version."
			});
		}
		if (crypto.createHash('sha1').update(clientVersion+socket.request.session.handshakeHash + handshakePublicSeed).digest('hex') == data.hash) {
			//User logged in
			socket.request.session.handshakeOk = true;
			socket.emit('handshakeOk', {});
		} else {
			socket.emit('mmo_error', {
				code: 1,
				msg: "Invalid handshake result"
			});
		}
	});

	if (!socket.request.session.handshakeHash) {
		// Handshake procedure not started, send token.
		socket.request.session.handshakeHash = crypto.createHash('sha1').update(handshakePrivateSeed + 'd28cb767c4272d8ab91000283c67747cb2ef7cd1').digest('hex');
		socket.emit('handshake', {
			hash: socket.request.session.handshakeHash
		});
	}
}

function processLoginSuccess(socket, account) {
	if (account.socketId != socket.id) {
		if (io.sockets.connected[account.socketId]) {
			console.log("Duplicate account connection, closing older sockets.", socket.id, account.socketId);
			io.sockets.connected[account.socketId].emit('mmo_error', {
				code: 3,
				msg: 'Logged from another place.'
			});
			io.sockets.connected[account.socketId].disconnect('Logged from another place.');
		}
	}
	Account.findOneAndUpdate({_id: account._id}, { socketId: socket.id }, function(err, account){
		// todo?
	});
}

function bindLoginEvents(socket) {
	socket.on('loginQuery', function(data){
		isHandshakedSession(socket);
		Account.findByName(data.username, function(err, account){
			if (err) {
				return socket.emit('loginResponse', {
					err: err.msg
				});
			}
			if (!account) {
				return socket.emit('loginResponse', {
					err: "Invalid username"
				});
			}

			crypto.pbkdf2(data.password, account.salt, 25000, 512, function(err, hashRaw){
				var hpass = new Buffer(hashRaw, 'binary').toString('hex');
				if (account.hash == hpass) {
					socket.request.session.user = account;
					processLoginSuccess(socket, account);
					return socket.emit('loginResponse', {
						msg: data.username
					});
				}
				return socket.emit('loginResponse', {
					err: "Invalid password"
				});
			})
		});
	});
}

module.exports = function(app, sessionMiddleware) {
	io = require('socket.io')(app.server);
	
	io.use(function(socket, next){
		socket.request.originalUrl = socket.request.url;
		sessionMiddleware(socket.request, socket.request.res, next);
	});

	io.on('connection', function(socket){
		console.log(' - User connected : ', socket.id);

		socket.on('disconnect', function(data){
			if (socket.request.session.user) {
				Account.findOneAndUpdate({id: socket.request.session.user.id}, { socketId: null }, function(err, account){
					// todo?
				});
			}
			socket.request.session = {};
			console.log(" - User disconnected");
		});

		bindHandshakeEvents(socket);
		bindLoginEvents(socket);
	});

	console.log("Socket.io running.")
}