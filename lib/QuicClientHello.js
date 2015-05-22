var util = require('util');
var QuicHandshakeMessage = require('./QuicHandshakeMessage');
var QuicTag = require('./QuicTag');

var QuicClientHello = module.exports = function QuicClientHello (buf) {
    QuicClientHello.super_.call(this, buf);

    if (!buf) {
        this._messageTag = QuicTag.CHLO;
        this._tags[QuicTag.ICSL] = new Buffer([300, 0, 0, 0]);
        this._tags[QuicTag.MSPC] = new Buffer([100, 0, 0, 0]);
    }
};
util.inherits(QuicClientHello, QuicHandshakeMessage);
Object.defineProperty(QuicClientHello.prototype, 'version', {
    'get': function () {
        return this._tags[QuicTag.VER];
    },
    'set': function (ver) {
        this._tags[QuicTag.VER] = new Buffer(ver);
    }
});
Object.defineProperty(QuicClientHello.prototype, 'serverConfigId', {
    'get': function () {
        return this._tags[QuicTag.SCID];
    },
    'set': function (id) {
        this._tags[QuicTag.SCID] = new Buffer(id);
    }
});
Object.defineProperty(QuicClientHello.prototype, 'serverToken', {
    'get': function () {
        return this._tags[QuicTag.STK];
    },
    'set': function (serverToken) {
        this._tags[QuicTag.STK] = new Buffer(serverToken);
    }
});
Object.defineProperty(QuicClientHello.prototype, 'serverNonce', {
    'get': function () {
        return this._tags[QuicTag.SNO];
    },
    'set': function (nonce) {
        this._tags[QuicTag.SNO] = new Buffer(nonce);
    }
});
Object.defineProperty(QuicClientHello.prototype, 'clientNonce', {
    'get': function () {
        return this._tags[QuicTag.NONC];
    },
    'set': function (nonce) {
        this._tags[QuicTag.NONC] = new Buffer(nonce);
    }
});
Object.defineProperty(QuicClientHello.prototype, 'encryptionAlgorithm', {
    'get': function () {
        return this._tags[QuicTag.AEAD];
    },
    'set': function (algo) {
        this._tags[QuicTag.AEAD] = new Buffer(algo);
    }
});
Object.defineProperty(QuicClientHello.prototype, 'keyExchangeMethod', {
    'get': function () {
        return this._tags[QuicTag.KEXS];
    },
    'set': function (method) {
        this._tags[QuicTag.KEXS] = new Buffer(method);
    }
});
Object.defineProperty(QuicClientHello.prototype, 'publicKey', {
    'get': function () {
        return this._tags[QuicTag.PUBS];
    },
    'set': function (key) {
        this._tags[QuicTag.PUBS] = new Buffer(key);
    }
});
