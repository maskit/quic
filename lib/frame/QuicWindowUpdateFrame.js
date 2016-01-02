var util = require('util');
var QuicStreamId = require('../QuicStreamId');
var QuicOffset = require('../QuicOffset');

var QuicWindowUpdateFrame = module.exports = function QuicWindowUpdateFrame (buf) {
    this._streamId = new QuicStreamId();
    this._byteOffset = new QuicOffset();

    if (buf) {
        this._streamId = new QuicStreamId(buf.readUInt32LE(1));
        this._byteOffset.set(buf.slice(5, 12));
    }
};
Object.defineProperty(QuicWindowUpdateFrame.prototype, 'size', {
    'get': function () {
        return 13;
    }
});
Object.defineProperty(QuicWindowUpdateFrame.prototype, 'streamId', {
    'get': function () {
        return this._streamId;
    },
    'set': function (streamId) {
        this._streamId = new QuicStreamId(streamId);
    }
});
Object.defineProperty(QuicWindowUpdateFrame.prototype, 'byteOffset', {
    'get': function () {
        return this._byteOffset;
    },
    'set': function (byteOffset) {
        this._byteOffset.set(byteOffset);
    }
});
QuicWindowUpdateFrame.prototype.toString = function toString () {
    return util.format('WindowUpdate [SI: %d BO: %s]', this.streamId, this.byteOffset);
};
QuicWindowUpdateFrame.prototype.getBuffer = function getBuffer() {
    var items = [
        new Buffer([0x04]),
        this._streamId.getBuffer(),
        this._byteOffset.getBuffer()
    ];
    var buf = Buffer.concat(items);
    return buf;
};
