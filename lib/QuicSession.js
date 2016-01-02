var util = require('util');
var events = require('events');

var QuicConnection = require('./QuicConnection');
var QuicSequenceNumber = require('./QuicSequenceNumber');
var QuicStreamId = require('./QuicStreamId');
var QuicPacketManager = require('./QuicPacketManager');
var QuicClientHello = require('./QuicClientHello');
var QuicOffset = require('./QuicOffset');
var QuicNonce = require('./QuicNonce');
var QuicTag = require('./QuicTag');
var QuicServerConfig = require('./QuicServerConfig');
var QuicKeyExchange = require('./QuicKeyExchange');
var QuicDeltaTime = require('./QuicDeltaTime');
var QuicStream               = require('./stream/QuicStream');
var QuicCryptoStream         = require('./stream/QuicCryptoStream');
var QuicHeadersStream        = require('./stream/QuicHeadersStream');
var QuicDataStream           = require('./stream/QuicDataStream');
var QuicPacket               = require('./packet/QuicPacket');
var QuicDecryptedPacket      = require('./packet/QuicDecryptedPacket');
var QuicFrame                = require('./frame/QuicFrame');
var QuicAckFrame             = require('./frame/QuicAckFrame');
var QuicStreamFrame          = require('./frame/QuicStreamFrame');
var QuicWindowUpdateFrame    = require('./frame/QuicWindowUpdateFrame');
var QuicPaddingFrame         = require('./frame/QuicPaddingFrame');
var QuicConnectionCloseFrame = require('./frame/QuicConnectionCloseFrame');
var QuicEncrypter            = require('./crypto/QuicEncrypter');
var QuicDecrypter            = require('./crypto/QuicDecrypter');

var QuicSession = module.exports = function QuicSession(options) {
    QuicSession.super_.call(this);

    var self = this;
    this._seqNum = new QuicSequenceNumber();
    this._packetManager = new QuicPacketManager(this);
    this._keyExchange = new QuicKeyExchange();
    this._encrypter = [new QuicEncrypter('null')];
    this._decrypter = [new QuicDecrypter('null')];
    this._qConn = new QuicConnection(options);
    if (options.token) {
        this._serverToken = new Buffer(options.token, 'hex');
    }
    if (options.config) {
        this._serverConfig = new QuicServerConfig(new Buffer(options.config, 'hex'));
    }
    if (options.nonce) {
        this._serverNonce = new Buffer(options.nonce, 'hex');
    }
    if (options.keyExchange) {
        this._keyExchange.method = options.keyExchange;
    }
    this._qConn.on('negotiated', function () {
        self._versionNegotiated = true;
    });
    this._qConn.on('packet', function (packet) {
        self._processPacket(packet);
    });
    this._qConn.on('unsupported', function (e) {
        self.emit('error', e);
    });

    this._receiveWindow = new QuicOffset();
    this._receiveWindow.increment(16384);

    this._streams = {};
    this._streams[new QuicStreamId(1)] = new QuicCryptoStream(this, 1);
    this._streams[new QuicStreamId(3)] = new QuicHeadersStream(this, 3);
    this.cryptoStream.on('message', function (hsMessage) {
        if (hsMessage.messageTag === QuicTag.REJ) {
            if (self._keyExchange.ready) {
                return;
            }
            if (hsMessage.tags[QuicTag.STK]) {
                self._serverToken = hsMessage.tags[QuicTag.STK];
            }
            if (hsMessage.tags[QuicTag.SNO]) {
                self._serverNonce = hsMessage.tags[QuicTag.SNO];
            }
            if (hsMessage.tags[QuicTag.SCFG]) {
                self._serverConfig = new QuicServerConfig(hsMessage.tags[QuicTag.SCFG]);
            }
            if (self._serverConfig.tags[QuicTag.KEXS]) {
                self._keyExchange.method = 'C255';
            }
            self.emit('rejected', hsMessage);
            self._sendClientHello();
            self._setupCrypto(self._serverConfig.publicKeys[0], false);
        } else if (hsMessage.messageTag === QuicTag.SHLO) {
            self._established = true;
            if (hsMessage.tags[QuicTag.STK]) {
                self._serverToken = hsMessage.tags[QuicTag.STK];
            }
            if (hsMessage.tags[QuicTag.PUBS]) {
                self._setupCrypto(hsMessage.tags[QuicTag.PUBS], true);
            } else {
                self.emit('error', 'SHLO must have PUBS tag');
            }
            self.emit('established', hsMessage);
        } else {
            self.emit('error', hsMessage, 'unknown handshake message');
        }
    });

    this._sendClientHello();
};
util.inherits(QuicSession, events.EventEmitter);

Object.defineProperty(QuicSession.prototype, 'options', {
    'get': function () {
        var options = {};
        options.host = this._qConn.host;
        options.port = this._qConn.port;
        if (this._serverToken) {
            options.token = this._serverToken.toString('hex');
        }
        if (this._serverConfig) {
            options.config = this._serverConfig.getBuffer().toString('hex');
        }
        if (this._serverNonce) {
            options.nonce = this._serverNonce.toString('hex');
        }
        if (this._keyExchange.method) {
            options.keyExchange = this._keyExchange.method;
        }
        return options;
    }
});

Object.defineProperty(QuicSession.prototype, 'connection', {
    'get': function () {
        return this._qConn;
    }
});
Object.defineProperty(QuicSession.prototype, 'isEstablished', {
    'get': function () {
        return this._established;
    }
});
Object.defineProperty(QuicSession.prototype, 'cryptoStream', {
    'get': function () {
        return this._streams[new QuicStreamId(1)];
    }
});
Object.defineProperty(QuicSession.prototype, 'headersStream', {
    'get': function () {
        return this._streams[new QuicStreamId(3)];
    }
});
QuicSession.prototype.sendFrame = function sendFrame (frame, callback) {
    var self = this;
    var packet = new QuicDecryptedPacket();
    if (!this._versionNegotiated) {
        packet.version = this._qConn.version;
    }
    packet.connectionId = this._qConn.id;
    packet.sequenceNumber = this._seqNum;
    packet.data = Buffer.concat([frame.getBuffer(), new QuicPaddingFrame().getBuffer()]);
    this.sendPacket(packet, function () {
        self.emit('sent', frame);
        if (callback) {
            callback();
        }
    });
    this._seqNum.increment();
};
QuicSession.prototype.sendPacket = function sendPacket (packet, callback) {
    var self = this;
    this._qConn.sendPacket(this._encrypter[0].encrypt(packet), function () {
        if (callback) {
            callback();
        }
    });
};

QuicSession.prototype.createDataStream = function createDataStream () {
    var largestStreamId = Math.max.apply({}, Object.keys(this._streams));
    var streamId = largestStreamId + ((largestStreamId & 0x01) ? 2 : 1);
    var stream = new QuicDataStream(this, streamId);
    this._streams[stream.id] = stream;
    return stream;
};

QuicSession.prototype.incrementWindow = function incrementWindow (size) {
    this._receiveWindow.increment(size);
    var wuf = new QuicWindowUpdateFrame();
    wuf.byteOffset = this._receiveWindow;
    this.sendFrame(wuf);
};

QuicSession.prototype._processPacket = function processPacket (packet) {
    var data = null,
        frame = null,
        cursor = 0,
        decrypted = null;
    decrypted = this._decryptPacket(packet);
    if (!decrypted) {
        this.emit('error', 'failed to decrypt (seq ' + packet.sequenceNumber + ')');
        return;
    }
    data = decrypted.data;
    var sendAck = false;
    while (cursor < data.length) {
        frame = QuicFrame.create(data.slice(cursor), packet);
        if (frame) {
            cursor += frame.size;
            this.emit('frame', frame);
            if (!this._processFrame(frame)) {
                break;
            }
        } else {
            this.emit('error', new Error('Unknown frame'));
            break;
        }
    }
    this.emit('packetProcessed', decrypted);
    if (this._shouldSendAck) {
        var f = new QuicAckFrame();
        f.entropy = this._packetManager.receivedEntropy;
        f.largestObserved = this._packetManager.largestObservedSeqNum;
        f.largestObservedDeltaTime = new QuicDeltaTime();
        f.deltaLargestObserved = 0;
        f.timeSinceLargestObserved = 0;
        this.sendFrame(f);
        this._shouldSendAck = false;
    }
};

QuicSession.prototype._decryptPacket = function decryptPacket (packet) {
    var decrypted = this._decrypter[0].decrypt(packet);
    if (!decrypted) {
        if (this._decrypter[1]) {
            console.log('@@ trying another decrypter');
            decrypted = this._decrypter[1].decrypt(packet);
            if (decrypted) {
                console.log('@@ switched (seq ' + packet.sequenceNumber + ')');
                this._decrypter.shift();
            }
        }
    }
    return decrypted;
};

QuicSession.prototype._processFrame = function processFrame (frame) {
    if (frame instanceof QuicStreamFrame) {
        this._shouldSendAck = true;
    } else if (frame instanceof QuicPaddingFrame) {
        this._shouldSendAck = true;
        return false;
    } else if (frame instanceof QuicAckFrame) {
    } else if (frame instanceof QuicConnectionCloseFrame) {
        this._shouldSendAck = false;
    } else {
        this._shouldSendAck = true;
    }
    return true;
};
QuicSession.prototype._createClientHello = function createClientHello () {
    var chlo = new QuicClientHello();
    chlo.version     = this._qConn.version;
    chlo.proofDemand = 'X509';
    chlo.serverName = this.options.host;
    // chlo.expectedLeafCertificate = 'abcdefgh';
    if (this._serverToken) {
        chlo.serverToken = this._serverToken;
    }
    if (this._serverConfig) {
        this._clientNonce = QuicNonce.generate(this._serverConfig.orbit);
        chlo.clientNonce = this._clientNonce;
        if (this._serverNonce) {
            chlo.serverNonce = this._serverNonce;
        }
        chlo.serverConfigId      = this._serverConfig.id;
        chlo.encryptionAlgorithm = 'AESG';
        chlo.keyExchangeMethod   = this._keyExchange.method;
        chlo.publicKey           = this._keyExchange.publicKey;
    }
    return chlo;
};
QuicSession.prototype._sendClientHello = function sendClientHello() {
    var chlo = this._createClientHello();
    console.log(chlo);
    var frame = new QuicStreamFrame();
    frame.data = chlo.getBuffer();
    this.cryptoStream.sendFrame(frame);
    this._clientHello = chlo;
};

QuicSession.prototype._setupCrypto = function setupCrypto (serverPublicKey, forwardSecure) {
    if (!this._keyExchange.ready) {
        this._keyExchange.setup(
                this._qConn.id.getBuffer(),
                this._clientNonce,
                this._serverNonce,
                this._clientHello.getBuffer(),
                this._serverConfig.getBuffer()
        );
    }
    var keyAndIv = this._keyExchange.update(serverPublicKey, forwardSecure);
    this._encrypter[0] = new QuicEncrypter(
            'aesg',
            keyAndIv.clientWriteKey,
            keyAndIv.clientWriteIv);
    this._decrypter[1] = new QuicDecrypter(
            'aesg',
            keyAndIv.serverWriteKey,
            keyAndIv.serverWriteIv);
};

