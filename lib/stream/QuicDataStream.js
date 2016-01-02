var util = require('util');
var events = require('events');
var QuicStream = require('./QuicStream');

var QuicDataStream = module.exports = function QuicDataStream (session, id) {
    var self = this;
    QuicDataStream.super_.call(this, session, id);
};
util.inherits(QuicDataStream, QuicStream);
