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
    this._tags['COPT'] = new Buffer('FIXD'); // ???
};
util.inherits(QuicClientHello, QuicHandshakeMessage);
var map = {
    'certificateSigndCertTimestamp': QuicTag.CSCT,
    'clientNonce':                   QuicTag.NONC,
    'encryptionAlgorithm':           QuicTag.AEAD,
    'keyExchangeMethod':             QuicTag.KEXS,
    'proofDemand':                   QuicTag.PDMD,
    'publicKey':                     QuicTag.PUBS,
    'serverConfigId':                QuicTag.SCID,
    'serverName':                    QuicTag.SNI,
    'serverNonce':                   QuicTag.SNO,
    'serverToken':                   QuicTag.STK,
    'version':                       QuicTag.VER,
    'expectedLeafCertificate':       QuicTag.XLCT,
};
function createAccessor (prop, tag) {
    Object.defineProperty(QuicClientHello.prototype, prop, {
        'get': function () {
            return this._tags[tag];
        },
        'set': function (value) {
            this._tags[tag] = new Buffer(value);
        }
    });
}
for (var prop in map) {
    createAccessor(prop, map[prop]);
}
