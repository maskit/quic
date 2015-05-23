var util = require('util');
var events = require('events');
var QuicStream = require('./QuicStream');
var QuicHandshakeMessage = require('./QuicHandshakeMessage');
var QuicTag = require('./QuicTag');

var QuicCryptoStream = module.exports = function QuicCryptoStream (session, id) {
    var self = this;
    QuicCryptoStream.super_.call(this, session, id);
    this.on('frame', function (frame) {
        var hsMessage = new QuicHandshakeMessage(frame.data);
        if (hsMessage.messageTag === QuicTag.REJ) {
            self.emit('reject', hsMessage);
        } else if (hsMessage.messageTag === QuicTag.SHLO) {
            self.emit('serverHello', hsMessage);
        } else {
            self.emit('error', hsMessage, 'unknown handshake message');
        }
    });
};
util.inherits(QuicCryptoStream, QuicStream);
