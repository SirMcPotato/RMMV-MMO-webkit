/* 
* @Author: Vinxce
* @Date:   2015-10-28 08:30:33
* @Last Modified by:   Vinxce
* @Last Modified time: 2015-10-28 09:24:38
*/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Account = require("./Account");

var Character = new Schema({
    owner: [{type: Schema.Types.ObjectId, ref: 'Account'}]
    name: {type: String, required: true, index: { unique: true}},
    position: {
    	x: Number,
    	y: Number,
    	mapName: String //[{type: Schema.Types.ObjectId, ref: 'Map'}]
    }
    inventory: [] //[{type: Schema.Types.ObjectId, ref: 'Item'}]
});


module.exports = mongoose.model('Character', Character);