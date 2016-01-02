var QuicTag = require('./QuicTag');

var QuicHandshakeMessage = module.exports = function QuicHandshakeMessage (buf) {
    this._messageTag = "";
    this._tags = {};

    if (buf) {
        this._messageTag = buf.slice(0, 4).toString('binary');
        var i, n = buf.readUInt16LE(4), k, v, size = 0, offset = 8 + 8 * n, cursor = offset;
        for (i = 0; i < n; ++i) {
            k = buf.slice(8 + (i * 8), 8 + (i * 8) + 4).toString('binary');
            size = buf.readUInt32LE(8 + (i * 8) + 4);
            v = buf.slice(cursor, offset + size);
            cursor = offset + size;
            this._tags[k] = v;
        }
    }
    
};
Object.defineProperty(QuicHandshakeMessage.prototype, 'messageTag', {
    'get': function () {
        return this._messageTag;
    },
    'set': function (tag) {
        this._messageTag = tag;
    }
});
Object.defineProperty(QuicHandshakeMessage.prototype, 'tags', {
    'get': function () {
        return this._tags;
    },
});
QuicHandshakeMessage.prototype.getBuffer = function getBuffer () {
    var minimumSize = 1024;

    var items = [
        new Buffer(this._messageTag),
    ];
    var nPairs = new Buffer(2);
    if (!this._tags[QuicTag.PAD]) {
        this._tags[QuicTag.PAD] = new Buffer(0);
    }
    nPairs.writeUInt16LE(Object.keys(this._tags).length);
    items.push(nPairs);
    items.push(new Buffer([0, 0]));
    index = new Buffer(8 * Object.keys(this._tags).length);
    items.push(index);
    var cursor = 0, size = 0;
    var self = this;
    Object.keys(this._tags).sort(function (a, b) {
        // FIXME: too rude
        var x = new Buffer(a), y = new Buffer(b);
        return (x[3] - y[3]) || (x[2] - y[2]) || (x[1] - y[1]) || (x[0] - y[0]);
    }).forEach(function (k) {
        index.write(k, cursor);
        if (k === QuicTag.PAD) {
            if (size > minimumSize) {
                index.writeUInt32LE(size, cursor + 4);
            } else {
                index.writeUInt32LE(minimumSize - size, cursor + 4);
                items.push(new Buffer(minimumSize - size).fill('-'));
                size += minimumSize - size;
            }
        } else {
            index.writeUInt32LE(size + self._tags[k].length, cursor + 4);
            items.push(self._tags[k]);
            size += self._tags[k].length;
        }
        cursor += 8;
    });
    return Buffer.concat(items);
};
