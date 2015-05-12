var util = require('util');
var QuicDeltaTime = require('./QuicDeltaTime');
var QuicSequenceNumber = require('./QuicSequenceNumber');
var QuicFrame = require('./QuicFrame');

var QuicAckFrame = module.exports = function QuicAckFrame (buf, packet) {
    QuicAckFrame.super_.call(this, buf, packet);

    this._flags = 0x40;
    this._entropy = 0;
    this._lgtObservedSeqNum = new QuicSequenceNumber();
    this._lgtObservedDeltaTime = new QuicDeltaTime();
    this._numTimestamp = 1;
    this._deltaLgtObservedSeqNum = 0;
    this._timeSinceLgtObserved = 0;
    this._timestamps = [];
    this._numberRanges = 0;
    this._numRevived = 0;

    if (buf) {
        var cursor = 0;
        this._flags = buf[cursor];
        cursor += 1;
        this._entropy = buf[cursor];
        cursor += 1;
        this._lgtObservedSeqNum = new QuicSequenceNumber(buf.slice(
                    cursor,
                    cursor + this.largestObservedSeqNumLen));
        cursor += this.largestObservedSeqNumLen;
        this._lgtObservedDeltaTime = new QuicDeltaTime(buf.slice(
                    cursor,
                    cursor + 2));
        cursor += 2;
        this._numTimestamp = buf[cursor];
        cursor += 1;
        this._deltaLgtObservedSeqNum = buf[cursor];
        cursor += 1;
        this._timeSinceLgtObserved = buf.readUInt32LE(cursor);
        cursor += 4;
        this._timestamps = new Array(this._numTimestamp);
        for (i = 0; i < this._numTimestamp - 1; ++i) {
            cursor += 1 + 2;
        }
        if (this.hasNackRange) {
            this._numberRanges = buf[cursor];
            cursor += (this.missingPacketRangeSeqNumLen + 1) * this.numberRanges;
            this._numRevived = buf[cursor];
            cursor += this.largestObservedSeqNumLen * this.numRevived;
        } else {
            this._numberRanges = 0;
            this._numRevived = 0;
        }
    }
};
util.inherits(QuicAckFrame, QuicFrame);
Object.defineProperty(QuicAckFrame.prototype, 'size', {
    'get': function () {
        var size = 0;
        size += 1; // Type
        size += 1; // Received Entropy
        size += this.largestObservedSeqNumLen;
        size += 2; // Largest Observed Delta Time
        size += 1; // Num Timestamp
        if (this.numTimestamp) {
            size += 1; // Delta Largest Observed
            size += 4; // Time Since Largest Observed
            size += (1 + 2) * (this.numTimestamp - 1); // (Delta Largest Observed + Time Since Previous Timestamp) * (n - 1)
        }
        if (this.hasNackRange) {
            size += 1; // Number Ranges
            size += (this.missingPacketRangeSeqNumLen + 1) * this.numberRanges;
            size += 1; // Num Revived
            size += this.largestObservedSeqNumLen * this.numRevived;
        }
        return size;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'hasNackRange', {
    'get': function () {
        return (this._flags & 0x20) !== 0;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'isTruncated', {
    'get': function () {
        return (this._flags & 0x10) !== 0;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'entropy', {
    'get': function () {
        return this._entropy;
    },
    'set': function (entropy) {
        this._entropy = entropy;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'largestObserved', {
    'get': function () {
        return this._lgtObservedSeqNum;
    },
    'set': function (seqNum) {
        this._lgtObservedSeqNum = seqNum;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'largestObservedDeltaTime', {
    'get': function () {
        return this._lgtObservedDeltaTime;
    },
    'set': function (deltaTime) {
        this._lgtObservedDeltaTime = deltaTime;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'numTimestamp', {
    'get': function () {
        return this._numTimestamp;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'deltaLargestObserved', {
    'get': function () {
        return this._deltaLgtObservedSeqNum;
    },
    'set': function (delta) {
        this._deltaLgtObservedSeqNum = delta;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'timeSinceLargestObserved', {
    'get': function () {
        return this._timeSinceLgtObserved;
    },
    'set': function (time) {
        this._timeSinceLgtObserved = time;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'numberRanges', {
    'get': function () {
        return this._numberRanges;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'numRevived', {
    'get': function () {
        return this._numRevived;
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'missingPacketRangeSeqNumLen', {
    'get': function () {
        switch (this._flags & 0x03) {
            case 0x00:
                return 1;
            case 0x01:
                return 2;
            case 0x02:
                return 4;
            case 0x03:
                return 6;
        }
    }
});
Object.defineProperty(QuicAckFrame.prototype, 'largestObservedSeqNumLen', {
    'get': function () {
        switch (this._flags & 0x0C) {
            case 0x00:
                return 1;
            case 0x04:
                return 2;
            case 0x08:
                return 4;
            case 0x0C:
                return 6;
        }
    }
});
QuicAckFrame.prototype.toString = function toString () {
    return util.format('Ack [H: %d, LO: %s]', this._entropy, this._lgtObservedSeqNum);
};
QuicAckFrame.prototype.getBuffer = function getBuffer () {
    var items = [
            new Buffer([this._flags, this._entropy]),
            this._lgtObservedSeqNum.getBuffer(this._lgtObservedSeqNum.minLen),
            new Buffer(2), // Largest Observed Delta Time
            new Buffer([this._timestamps.length + 1]),
            new Buffer([this._deltaLgtObservedSeqNum]),
            new Buffer(4) // Time Since Largest Observed
        ];
    items[2].writeUInt16LE(this._lgtObservedDeltaTime);
    items[5].writeUInt32LE(this._timeSinceLgtObserved);
    if (this.hasNackRange) {
    }
    var buf = Buffer.concat(items);
    return buf;
};
