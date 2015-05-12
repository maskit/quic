var QuicStreamId = require('./QuicStreamId');
var QuicStreamFrame = require('./QuicStreamFrame');
var QuicOffset = require('./QuicOffset');

var QuicStream = module.exports = function QuicStream (session, id) {
    this._session = session;
    this._id = new QuicStreamId(id);
    this._dataOffset = new QuicOffset();
};
QuicStream.prototype.sendFrame = function sendFrame (frame) {
    frame.streamId = this._id;
    if (frame instanceof QuicStreamFrame) {
        frame.offset = this._dataOffset;
        this._dataOffset.increment(frame.dataLen);
    }
    this._session.sendFrame(frame);
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
