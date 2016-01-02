var util = require('util');
var QuicPacket = require('./QuicPacket');

var QuicDecryptedPacket = module.exports = function QuicDecryptedPacket (buf) {
    QuicDecryptedPacket.super_.call(this, buf);

    this._privateFlags = 0;
    this._privateFlags |= 0x01; // TODO: Entropy flag should be set at random.
    this._fec = 0;
    this._data = new Buffer(0);

    if (buf) {
        this._privateFlags = buf[this.size];
        if ((this._privateFlags & 0xF8) !== 0) {
            throw new Error('invalid packet data');
        }
        if (this.hasFEC) {
            this._fec = buf[this.size + 1];
            this._data = buf.slice(this.size + 2);
        } else {
            this._data = buf.slice(this.size + 1);
        }
    }
};
util.inherits(QuicDecryptedPacket, QuicPacket);
Object.defineProperty(QuicDecryptedPacket.prototype, 'hasEntropy', {
    'get': function () {
        return (this._privateFlags & 0x01) !== 0;
    }
});
Object.defineProperty(QuicDecryptedPacket.prototype, 'hasFecGroup', {
    'get': function () {
        return (this._privateFlags & 0x02) !== 0;
    }
});
Object.defineProperty(QuicDecryptedPacket.prototype, 'isFec', {
    'get': function () {
        return (this._privateFlags & 0x04) !== 0;
    }
});
Object.defineProperty(QuicDecryptedPacket.prototype, 'data', {
    'get': function () {
        return this._data;
    },
    'set': function (data) {
        this._data = data;
        var items = [];
        items.push(new Buffer([this._privateFlags]));
        if (this.hasFEC) {
            items.push(new Buffer([this._fec]));
        }
        items.push(this._data);
        this._payload = Buffer.concat(items);
    }
});
QuicDecryptedPacket.prototype.toString = function toString () {
    var str = QuicDecryptedPacket.super_.prototype.toString.call(this) + "\n";
    str += "Private flags:\n";
    str += " ENTROPY: " + this.hasEntropy + "\n";
    str += " FEC_GROUP: " + this.hasFecGroup + "\n";
    str += " FEC: " + this.isFec;
    return str;
};
QuicDecryptedPacket.prototype.getBuffer = function getBuffer () {
    var items = [];
    items.push(this.associatedData);
    items.push(this._privateFlags);
    if (this.hasFEC) {
        items.push(new Buffer([0]));
    }
    items.push(this._payload);
    var buf = Buffer.concat(items);
    return buf;
};
