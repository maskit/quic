var util = require('util');
var QuicBlockedFrame = module.exports = function QuicBlockedFrame (buf) {
    this._streamId = 0;

    if (buf) {
        this._streamId = buf.readUInt32LE(1);
    }
};
Object.defineProperty(QuicBlockedFrame.prototype, 'size', {
    'get': function () {
        return 5;
    }
});
Object.defineProperty(QuicBlockedFrame.prototype, 'streamId', {
    'get': function () {
        return this._streamId;
    }
});
QuicBlockedFrame.prototype.toString = function toString () {
    return util.format('Blocked [SI: %d]', this.streamId);
};
QuicBlockedFrame.prototype.getBuffer = function getBuffer() {
    var buf =  new Buffer([0x05, 0x00, 0x00, 0x00, 0x00]);
    items[0].writeUInt32LE(this._streamId, 1);
    return buf;
};
