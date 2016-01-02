var util = require('util');
var QuicRstStreamFrame = module.exports = function QuicRstStreamFrame (buf) {
    this._streamId = 0;
    this._errorCode = 0;

    if (buf) {
        this._streamId = buf.readUInt32LE(1);
        this._errorCode = buf.readUInt32LE(5);
    }
};
Object.defineProperty(QuicRstStreamFrame.prototype, 'size', {
    'get': function () {
        return 9;
    }
});
Object.defineProperty(QuicRstStreamFrame.prototype, 'streamId', {
    'get': function () {
        return this._streamId;
    }
});
Object.defineProperty(QuicRstStreamFrame.prototype, 'errorCode', {
    'get': function () {
        return this._errorCode;
    }
});
QuicRstStreamFrame.prototype.toString = function toString () {
    return util.format('RstStream [SI: %d, EC: %d]', this.streamId, this.errorCode);
};
QuicRstStreamFrame.prototype.getBuffer = function getBuffer() {
    var buf =  new Buffer([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    items[0].writeUInt32LE(this._streamId, 1);
    items[0].writeUInt32LE(this._errorCode, 5);
    return buf;
};
