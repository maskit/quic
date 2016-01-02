var util = require('util');
var QuicFrame = require('./QuicFrame');
var QuicSequenceNumber = require('../QuicSequenceNumber');
var QuicStopWaitingFrame = module.exports = function QuicStopWaitingFrame (buf, packet) {
    QuicStopWaitingFrame.super_.call(this, buf, packet);
    this._sentEntropy = 0;
    this._leastUnackedDelta = new QuicSequenceNumber();

    if (buf) {
        this._sentEntropy = buf[1];
        this._leastUnackedDelta = new QuicSequenceNumber(buf.slice(1, 1 + this._packet.sequenceNumLen));
    }
};
util.inherits(QuicStopWaitingFrame, QuicFrame);
Object.defineProperty(QuicStopWaitingFrame.prototype, 'size', {
    'get': function () {
        return 2 + this._packet.sequenceNumLen;
    }
});
Object.defineProperty(QuicStopWaitingFrame.prototype, 'sentEntropy', {
    'get': function () {
        return this._sentEntropy;
    }
});
Object.defineProperty(QuicStopWaitingFrame.prototype, 'leastUnackedDelta', {
    'get': function () {
        return this._leastUnackedDelta;
    }
});
QuicStopWaitingFrame.prototype.toString = function toString () {
    var str = util.format('StopWaiting [SE: %d, LUD: %s]',
            this.sentEntropy, this.leastUnackedDelta);
    return str;
};
QuicStopWaitingFrame.prototype.getBuffer = function getBuffer() {
    return new Buffer([0x06]);
};
