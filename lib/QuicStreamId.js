var QuicStreamId = module.exports = function QuicStreamId (id) {
    if (id) {
        this._id = 0 + id;
    } else {
        this._id = 0;
    }
};
QuicStreamId.prototype.toString = function toString () {
    return this._id.toString();
};
QuicStreamId.prototype.valueOf = function valueOf () {
    return this._id;
};
QuicStreamId.prototype.getBuffer = function getBuffer (len) {
    if (!len) {
        len = 4;
    }
    var buf = new Buffer(len);
    buf.writeUIntLE(this._id, 0, len);
    return buf;
};
