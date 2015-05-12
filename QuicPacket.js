var util = require('util');
var QuicPacketPublicHeader = require('./QuicPacketPublicHeader');

var QuicPacket = module.exports = function QuicPacket (buf) {
    QuicPacket.super_.call(this, buf);
    this._payload = new Buffer(0);

    if (buf) {
        this._payload = buf.slice(this.size);
    }
};
util.inherits(QuicPacket, QuicPacketPublicHeader);
Object.defineProperty(QuicPacket.prototype, 'payload', {
    'get': function () {
        return this._payload;
    },
});
Object.defineProperty(QuicPacket.prototype, 'associatedData', {
    'get': function () {
        var items = [
            new Buffer([this._publicFlags]),
        ];
        if (this.connectionIdLen !== 0) {
            items.push(this._connectionId.getBuffer());
        }
        if (this.hasVersion) {
            items.push(this._version);
        }
        items.push(this._sequenceNumber.getBuffer(this._sequenceNumber.minLen));
        return Buffer.concat(items);
    }
});
QuicPacket.prototype.toString = function toString () {
    var str = QuicPacket.super_.prototype.toString.call(this) + "\n";
    return str;
};
QuicPacket.prototype.getBuffer = function getBuffer () {
    var items = [
        this.associatedData,
        this.payload,
    ];
    var buf = Buffer.concat(items);
    return buf;
};
