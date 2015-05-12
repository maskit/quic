/*
 * HMAC-based Extract-and-Expand Key Derivation Function (HKDF)
 * https://tools.ietf.org/rfc/rfc5869.txt
 */
var crypto = require('crypto');
var HKDF = module.exports = function HKDF (hashAlg) {
    this._hashAlg = hashAlg;
};

HKDF.prototype.extract = function extract (salt, ikm) {
    if (!salt) {
        salt = new Buffer(0);
    }
    var hmac = crypto.createHmac(this._hashAlg, salt);
    hmac.update(ikm);
    return hmac.digest();
};

HKDF.prototype.expand = function expand (prk, info, len) {
    var i,
        hashLen = crypto.createHash(this._hashAlg).digest().length,
        n = Math.ceil(len / hashLen),
        t = new Array(n + 1);
    t[0] = new Buffer(0);
    for (i = 1; i <= n; ++i) {
        t[i] = crypto.createHmac(this._hashAlg, prk)
            .update(Buffer.concat([t[i - 1], info, new Buffer([i])]))
            .digest();
    }
    return Buffer.concat(t, hashLen * n).slice(0, len);
};

HKDF.prototype.derive = function derive (salt, ikm, info, len) {
    return this.expand(this.extract(salt, ikm), info, len);
};
