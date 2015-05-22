var util = require('util');
var QuicConnectionCloseFrame = module.exports = function QuicConnectionCloseFrame (buf) {
    this._errorCode = 0;
    this._reasonLen = 0;

    if (buf) {
        this._errorCode = buf.readUInt32LE(1);
        this._reasonLen = buf.readUInt16LE(5);
        this._reason = buf.toString('ascii', 7, 7 + this._reasonLen);
    }
};
Object.defineProperty(QuicConnectionCloseFrame.prototype, 'size', {
    'get': function () {
        return 7 + this.reasonLen;
    }
});
Object.defineProperty(QuicConnectionCloseFrame.prototype, 'errorCode', {
    'get': function () {
        return this._errorCode;
    }
});
Object.defineProperty(QuicConnectionCloseFrame.prototype, 'reasonLen', {
    'get': function () {
        return this._reasonLen;
    }
});
Object.defineProperty(QuicConnectionCloseFrame.prototype, 'reason', {
    'get': function () {
        return this._reason;
    }
});
QuicConnectionCloseFrame.prototype.toString = function toString () {
    return util.format('ConnectionClose [EC: %d, RL: %d, R: %s]', this.errorCode, this.reasonLen, this.reason);
};
QuicConnectionCloseFrame.prototype.getBuffer = function getBuffer() {
    var items = [];
    items.push(new Buffer([0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
    items[0].writeUInt32LE(this._errorCode, 1);
    items[0].writeUInt16LE(this._reasonLen, 5);
    if (this._reasonLen) {
        items.push(new Buffer(this._reason));
    }
    return Buffer.concat(items);
};
