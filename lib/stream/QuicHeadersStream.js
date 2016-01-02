var util = require('util');
var events = require('events');
var HPACK = require('hpack');
var QuicStream = require('./QuicStream');
var QuicStreamFrame = require('../frame/QuicStreamFrame');

var QuicHeadersStream = module.exports = function QuicHeadersStream (session, id) {
    var self = this;
    QuicHeadersStream.super_.call(this, session, id);

    this._hpack = new HPACK();

    this.on('data', function (data) {
        var headers = self._hpack.decode(data.slice(9));
        self.emit('headers', headers);
    });
};
util.inherits(QuicHeadersStream, QuicStream);

QuicHeadersStream.prototype.sendHeaders = function sendHeaders (headers, callback) {
    var stream = this._session.createDataStream();
    var frame = new QuicStreamFrame();
    var h2FrameHeader = new Buffer(9);
    h2FrameHeader[3] = 0x01; // h2 frame type
    h2FrameHeader[4] = 0x25; // h2 frame flag
    h2FrameHeader.writeUIntBE(stream.id.valueOf(), 5, 4); // stream id
    var h2HeadersFrameHeader = new Buffer([
        0x00, 0x00, 0x00, 0x00, // dependency
        0x01, // weight
    ]);
    var h2HeadersBlock = this._hpack.encode(headers);
    h2FrameHeader.writeUIntBE(h2HeadersFrameHeader.length + h2HeadersBlock.length , 0, 3);
    frame.data = Buffer.concat([
        h2FrameHeader,
        h2HeadersFrameHeader,
        h2HeadersBlock
    ]);
    this.sendFrame(frame, callback);
    return stream;
};
