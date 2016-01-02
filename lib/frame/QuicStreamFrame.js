var util = require('util');
var QuicStreamId = require('../QuicStreamId');
var QuicOffset = require('../QuicOffset');

var QuicStreamFrame = module.exports = function QuicStreamFrame (buf) {
    this._flags = 0xA0;
    this._streamId = new QuicStreamId();
    this._offset = new QuicOffset();
    this._data = new Buffer(0);

    if (buf) {
        this._flags = buf[0];
        this._streamId = new QuicStreamId(buf.readUIntLE(1), this.streamIdLen);
        switch (this.offsetLen) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
        }
        if (this.hasDataLen) {
            var len = buf.readUInt16LE(this.size - 2);
            this._data = new Buffer(buf.slice(this.size, this.size + len));
        } else {
            this._data = new Buffer(buf.slice(this.size));
        }
    }
};
Object.defineProperty(QuicStreamFrame.prototype, 'size', {
    'get': function () {
        return 1 + this.streamIdLen + this.offsetLen + (this.hasDataLen ? 2 : 0) + this.data.length;
    }
});
Object.defineProperty(QuicStreamFrame.prototype, 'isFin', {
    'get': function () {
        return (this._flags & 0x40) !== 0;
    },
    'set': function (value) {
        this._flags &= ~0x40;
        if (value) {
            this._flags |= 0x40;
        }
    }
});
Object.defineProperty(QuicStreamFrame.prototype, 'hasDataLen', {
    'get': function () {
        return (this._flags & 0x20) !== 0;
    }
});
Object.defineProperty(QuicStreamFrame.prototype, 'offsetLen', {
    'get': function () {
        switch (this._flags & 0x1C) {
            case 0x00:
                return 0;
            case 0x04:
                return 2;
            case 0x08:
                return 3;
            case 0x0C:
                return 4;
            case 0x10:
                return 5;
            case 0x14:
                return 6;
            case 0x18:
                return 7;
            case 0x1C:
                return 8;
        }
    }
});
Object.defineProperty(QuicStreamFrame.prototype, 'streamIdLen', {
    'get': function () {
        switch (this._flags & 0x03) {
            case 0x00:
                return 1;
            case 0x01:
                return 2;
            case 0x02:
                return 3;
            case 0x03:
                return 4;
        }
    }
});
Object.defineProperty(QuicStreamFrame.prototype, 'streamId', {
    'get': function () {
        return this._streamId;
    },
    'set': function (id) {
        this._streamId = new QuicStreamId(id);
    }
});
Object.defineProperty(QuicStreamFrame.prototype, 'offset', {
    'get': function () {
        return this._offset;
    },
    'set': function (offset) {
        this._offset.set(offset);
        if (this._offset.minLen) {
            this._flags = this._flags & ~0x1C | (Math.max(this._offset.minLen, 2) - 1) << 2;
        }
    }
});
Object.defineProperty(QuicStreamFrame.prototype, 'dataLen', {
    'get': function () {
        return this._data.length;
    },
});
Object.defineProperty(QuicStreamFrame.prototype, 'data', {
    'get': function () {
        return this._data;
    },
    'set': function (data) {
        this._data = new Buffer(data);
    }
});
QuicStreamFrame.prototype.toString = function toString () {
    return util.format('Stream [SID: %d, DLEN: %d]', this.streamId, this.data.length);
};
QuicStreamFrame.prototype.getBuffer = function getBuffer() {
    var items = [
        new Buffer([this._flags]),
        this._streamId.getBuffer(this.streamIdLen),
        ];
    if (this.offsetLen) {
        items.push(this._offset.getBuffer(this._offset.minLen));
    }
    if (this.hasDataLen) {
        var buf = new Buffer(2);
        buf.writeUInt16LE(this.dataLen);
        items.push(buf);
    }
    items.push(this._data);
    return Buffer.concat(items);
};
