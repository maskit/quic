var C255 = require('./C255');
var HKDF = require('./hkdf');

var QuicKeyExchange = module.exports = function QuicKeyExchange () {
    this._hkdf = new HKDF('sha256');
    this._ready = false;
    this._method = null;
    this._secretKey = null;
    this._publicKey = null;
};
Object.defineProperty(QuicKeyExchange.prototype, 'ready', {
    'get': function () {
        return this._ready;
    }
});
Object.defineProperty(QuicKeyExchange.prototype, 'method', {
    'get': function () {
        return this._method;
    },
    'set': function (method) {
        if (this._method !== method) {
            this._secretKey = C255.makeSecretKey();
            this._publicKey = C255.derivePublicKey(this._secretKey);
            this._method = method;
        }
    }
});
Object.defineProperty(QuicKeyExchange.prototype, 'publicKey', {
    'get': function () {
        if (!this._method) {
            throw new Error('key exchange method is not specified');
        }
        return this._publicKey;
    }
});
QuicKeyExchange.prototype.setup = function setup (connectionId, clientNonce, serverNonce, clientHello, serverConfig) {
    // IKM suffix
    this._ikmSuffix = Buffer.concat([
        connectionId,
        clientHello,
        serverConfig
    ]);

    // salt
    var items = [];
    items.push(clientNonce);
    if (serverNonce) {
        items.push(serverNonce);
    }
    this._salt = Buffer.concat(items);

    this._ready = true;
};
QuicKeyExchange.prototype.update = function update (serverPublicKey, forwardSecure) {
    if (!this._method) {
        throw new Error('key exchange method is not specified');
    }
    if (!this._ready) {
        throw new Error('key exchange is not ready');
    }

    // premaster
    var premaster = C255.deriveSharedKey(this._secretKey, serverPublicKey);
    // IKM
    var items = [];
    if (forwardSecure) {
        items.push(new Buffer("QUIC forward secure key expansion\0"));
    } else {
        items.push(new Buffer("QUIC key expansion\0"));
    }
    items.push(this._ikmSuffix);
    var ikm = Buffer.concat(items);

    var materialLen = (16 + 4) * 2; // key len(16) + IV len(4) for encrypter and decrypter
    var material = this._hkdf.derive(this._salt, premaster, ikm, materialLen);

    return {
        'clientWriteKey': material.slice(0, 16),
        'serverWriteKey': material.slice(16, 32),
        'clientWriteIv':  material.slice(32, 36),
        'serverWriteIv':  material.slice(36, 40)
    };
};
