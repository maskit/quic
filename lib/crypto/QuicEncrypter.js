var crypto = require('crypto');
var CryptoUtil = require('./CryptoUtil');
var QuicPacket = require('../packet/QuicPacket');

var QuicEncrypter = module.exports = function QuicEncrypter (algo, key, ivPrefix) {
    this._impl = new impl[algo](key, ivPrefix);
};
QuicEncrypter.prototype.encrypt = function encrypt (packet) {
    return this._impl.encrypt(packet);
};

var NullEncrypter = function NullEncrypter (key, ivPrefix) {
};
NullEncrypter.prototype.encrypt = function encrypt (packet) {
    var items = new Array(3); 
    items[0] = packet.associatedData;
    items[2] = packet.payload;
    items[1] = CryptoUtil.fnvHash(items[0], items[2]);
    return new QuicPacket(Buffer.concat(items));
};

var AesgEncrypter = function AesgEncrypter (key, ivPrefix) {
    this._key = key;
    this._ivPrefix = ivPrefix;
};
AesgEncrypter.prototype.encrypt = function encrypt (packet) {
    var iv = Buffer.concat([this._ivPrefix, packet.sequenceNumber.getBuffer()]);
    var cipher = crypto.createCipheriv('aes-128-gcm', this._key, iv);
    cipher.setAAD(packet.associatedData);
    var items = [];
    items.push(packet.associatedData);
    items.push(cipher.update(packet.payload));
    items.push(cipher.final());
    items.push(cipher.getAuthTag().slice(0, 12));
    return new QuicPacket(Buffer.concat(items));
};

var impl = {
    'null': NullEncrypter,
    'aesg': AesgEncrypter,
};

