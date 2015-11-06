/*:
 * @plugindesc Network Integration with socket.io
 * @author Vinxce
 *
 * @param Server IP
 * @desc The IP address of the remote server
 * @default 127.0.0.1
 *
 * @param Server port
 * @desc The port used for socket.io
 * @default 8000
 *
 */

//=============================================================================
// Network.js
//=============================================================================
//
// Network.js is a socket-io wrapper for the RMMV client.
//

var $network;

// TODO - clientVersion must be fetched from conf file.
var clientVersion = "1.0.1a";

(function() {

	var parameters = PluginManager.parameters('Network');
    var server_ip = String(parameters['Server IP'] || '127.0.0.1');
    var server_port = String(parameters['Server port'] || '8000');

    var handshakePublicSeed = "331e32c90d6f17b50f3070369aa58d902d379c50";

    ////////////////////////////////////////////////////////////////////////////////////////

    var Network = function(ip, port) {
    	this._ip = ip;
    	this._port = port;
    	this.initialize();
    }

    Network.prototype.initialize = function() {
    	console.log('http://'+this._ip+((this._port)?(':'+this._port):''));
    	this.socket = io('http://'+this._ip+((this._port)?(':'+this._port):''));
    	this._bindBaseEvents();
    }

    Network.prototype._bindBaseEvents = function() {
    	var that = this;
        this.socket.on('connect', function(){
    		console.log('Connected');
    	});
    	this.socket.on('disconnect', function(){
    		console.log('Disconnected');
    	});
        this.socket.on('handshake', function(data){
            console.log('Hanshake requested : ', data.hash);
            var result =  CryptoJS.SHA1(clientVersion+data.hash+handshakePublicSeed).toString(CryptoJS.enc.Hex);
            that.socket.emit('handshakeResult', {
                hash: result,
                clientVersion: clientVersion
            });
        });
        this.socket.on('mmo_error', function(data){
            console.error(data.code, data.msg);
            //Throw error to the screen!
            that.socket.close();
            throw new Error(data.msg);
        });
        this.socket.on('handshakeOk', function(data){
            console.info('Handshake success');
        });
    }

    Network.prototype.on = function(type, callback) {
		this.socket.on(type, callback);
    }

    Network.prototype.emit = function(type, data) {
        this.socket.emit(type, data);
    }    

    $network = new Network(server_ip, server_port);

})();