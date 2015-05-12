var crypto = require('crypto');
var ec = new (require('elliptic').ec)('curve25519');

function flip(buf) {
    var i,
        n = buf.length,
        newBuf = new Buffer(n);
    
    for (i = 0; i < n; ++i) {
        newBuf[i] = buf[n - i - 1];
    }
    return newBuf;
}

var C255 = module.exports = {
    makeSecretKey: function makeSecretKey () {
        return new Buffer(ec.genKeyPair().getPrivate('hex'), 'hex');
    },
    derivePublicKey: function derivePublicKey (secretKey) {
        return flip(new Buffer(ec.keyFromPrivate(secretKey).getPublic('hex'), 'hex'));
    },
    deriveSharedKey: function deriveSharedKey (secretKey, publicKey) {
        var pub = ec.keyFromPublic(flip(publicKey)).getPublic();
        var kp = ec.keyFromPrivate(secretKey);
        var sharedKeyHex = kp.derive(pub).toString(16);
        if (sharedKeyHex.length === 63) {
            sharedKeyHex = '0' + sharedKeyHex;
        }
        var sharedKey = new Buffer(sharedKeyHex, 'hex');
        return flip(sharedKey);
        // return flip(new Buffer(ec.keyFromPrivate(secretKey).derive(pub).toString(16), 'hex'));
    }
};
