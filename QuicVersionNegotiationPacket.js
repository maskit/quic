var QuicVersionNegotiationPacket = module.exports = function QuicVersionNegotiationPacket (buf) {
    var cursor;
    this._versionList = [];

    if (buf) {
        this._versionList = [];
        for (cursor = 9; cursor + 4 <= buf.length; cursor += 4) {
            this._versionList.push(new Buffer(buf.slice(cursor, cursor + 4)));
        }
    }
};
Object.defineProperty(QuicVersionNegotiationPacket.prototype, 'versions', {
    'get': function () {
        return this._versionList;
    }
});
QuicVersionNegotiationPacket.prototype.toString = function toString () {
    var str = 'Versions:\n';
    this._versionList.forEach(function (item) {
        str += ' ' + item + "\n";
    });
    return str;
};
