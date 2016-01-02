var util = require('util');
var events = require('events');
var QuicStream = require('./QuicStream');
var QuicHandshakeMessage = require('../QuicHandshakeMessage');

var QuicCryptoStream = module.exports = function QuicCryptoStream (session, id) {
    var self = this;
    QuicCryptoStream.super_.call(this, session, id);
    var buf = new Buffer(0);
    var nTags = null;
    var messageLen = null;
    var hsMessage = null;
    this.on('data', function (data) {
        if (nTags === null) {
            nTags = data.readUInt16LE(4);
        }
        buf = Buffer.concat([buf, data]);
        if (messageLen === null && buf.length >= 8 + nTags * 8) {
            messageLen = 8 + nTags * 8 + buf.readUInt32LE(8 + nTags * 8 - 4);
        }
        if (messageLen && buf.length >= messageLen) {
            hsMessage = new QuicHandshakeMessage(buf.slice(0, messageLen));
            self.emit('message', hsMessage);
            buf = buf.slice(messageLen);
            nTags = null;
            messageLen = null;
            hsMessage = null;
        }
    });
};
util.inherits(QuicCryptoStream, QuicStream);
