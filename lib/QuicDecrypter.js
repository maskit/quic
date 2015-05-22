var crypto = require('crypto');
var CryptoUtil = require('./CryptoUtil');
var QuicDecryptedPacket = require('./QuicDecryptedPacket');

var QuicDecrypter = module.exports = function QuicDecrypter (algo, key, ivPrefix) {
    this._impl = new impl[algo](key, ivPrefix);
};
QuicDecrypter.prototype.decrypt = function decrypt (packet) {
    return this._impl.decrypt(packet);
};

var NullDecrypter = function NullDecrypter (key, ivPrefix) {
};
NullDecrypter.prototype.decrypt = function decrypt (packet) {
    var items = [];
    items.push(packet.associatedData);
    items.push(packet.payload.slice(12));
    var hash = CryptoUtil.fnvHash(items[0], items[1]);
    if (hash.equals(packet.payload.slice(0, 12))) {
        return new QuicDecryptedPacket(Buffer.concat(items));
    } else {
        return null;
    }
};

var AesgDecrypter = function AesgDecrypter (key, ivPrefix) {
    this._key = key;
    this._ivPrefix = ivPrefix;
};
AesgDecrypter.prototype.decrypt = function decrypt (packet) {
    var iv = Buffer.concat([this._ivPrefix, packet.sequenceNumber.getBuffer()]);
    var decipher = crypto.createDecipheriv('aes-128-gcm', this._key, iv);
    decipher.setAAD(packet.associatedData);
    decipher.setAuthTag(packet.payload.slice(-12));
    var encrypted = packet.payload.slice(0, -12);
    var decrypted = decipher.update(encrypted);
    try {
        decipher.final();
        decrypted = new QuicDecryptedPacket(Buffer.concat([packet.associatedData, decrypted]));
    } catch (e) {
        // console.log(e);
        decrypted = null;
    }
    return decrypted;
};

var impl = {
    'null': NullDecrypter,
    'aesg': AesgDecrypter,
};
