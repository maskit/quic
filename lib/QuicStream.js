var util = require('util');
var events = require('events');
var QuicStreamId = require('./QuicStreamId');
var QuicStreamFrame = require('./QuicStreamFrame');
var QuicOffset = require('./QuicOffset');

var QuicStream = module.exports = function QuicStream (session, id) {
    var self = this;
    QuicStream.super_.call(this);
    this._session = session;
    this._id = new QuicStreamId(id);
    this._dataOffset = new QuicOffset();
    var onFrame = function (frame) {
        if (frame instanceof QuicStreamFrame) {
            if (frame.streamId.valueOf() === self._id.valueOf()) {
                self.emit('frame', frame);
            }
        }
        if (frame.isFin) {
            session.removeListener('frame', onFrame);
        }
    };
    session.on('frame', onFrame);
};
util.inherits(QuicStream, events.EventEmitter);
QuicStream.prototype.sendFrame = function sendFrame (frame, callback) {
    frame.streamId = this._id;
    if (frame instanceof QuicStreamFrame) {
        frame.offset = this._dataOffset;
        this._dataOffset.increment(frame.dataLen);
    }
    this._session.sendFrame(frame, callback);
};
Object.defineProperty(QuicStream.prototype, 'id', {
    'get': function () {
        return this._id;
    },
    'set': function (id) {
        if (id instanceof QuicStreamId) {
            this._id = id;
        } else {
            this._id = new QuicStreamId(id);
        }
    }
});
