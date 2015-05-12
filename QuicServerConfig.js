var QuicTag = require('./QuicTag');

var QuicServerConfig = module.exports = function QuicServerConfig (buf) {
    this._buf = new Buffer(buf);
    this._tags = {};
    var i, n = buf.readUInt16LE(4), k, v, size, offset = 8 + 8 * n, cursor = offset;
    for (i = 0; i < n; ++i) {
        k = buf.slice(8 + (i * 8), 8 + (i * 8) + 4).toString('binary');
        size = buf.readUInt32LE(8 + (i * 8) + 4);
        v = buf.slice(cursor, offset + size);
        cursor = offset + size;
        this._tags[k] = v;
    }
};
Object.defineProperty(QuicServerConfig.prototype, 'tags', {
    'get': function () {
        return this._tags;
    }
});
Object.defineProperty(QuicServerConfig.prototype, 'id', {
    'get': function () {
        return this._tags[QuicTag.SCID];
    }
});
Object.defineProperty(QuicServerConfig.prototype, 'publicKeys', {
    'get': function () {
        var keys = [];
        var buf = this._tags[QuicTag.PUBS];
        var i, bufLen = buf.length, len;
        for (i = 0; i < bufLen; ++i) {
            len = buf.readUIntLE(i, 3);
            i += 3;
            keys.push(buf.slice(i, i + len));
            i += len;
        }
        return keys;
    }
});
Object.defineProperty(QuicServerConfig.prototype, 'orbit', {
    'get': function () {
        return this._tags[QuicTag.OBIT];
    }
});
QuicServerConfig.prototype.getBuffer = function getBuffer () {
    return this._buf;
};
