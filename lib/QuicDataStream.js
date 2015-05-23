var util = require('util');
var events = require('events');
var QuicStream = require('./QuicStream');

var QuicDataStream = module.exports = function QuicDataStream (session, id) {
    var self = this;
    QuicDataStream.super_.call(this, session, id);
    this.on('frame', function (frame) {
        self.emit('data', frame.data);
    });
};
util.inherits(QuicDataStream, QuicStream);
