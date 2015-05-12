var util = require('util');
var events = require('events');

var QuicConnection = require('./QuicConnection');
var QuicSequenceNumber = require('./QuicSequenceNumber');
var QuicStream = require('./QuicStream');
var QuicStreamId = require('./QuicStreamId');
var QuicPacketManager = require('./QuicPacketManager');
var QuicPacket = require('./QuicPacket');
var QuicDecryptedPacket = require('./QuicDecryptedPacket');
var QuicFrame = require('./QuicFrame');
var QuicAckFrame = require('./QuicAckFrame');
var QuicPingFrame = require('./QuicPingFrame');
var QuicStreamFrame = require('./QuicStreamFrame');
var QuicPaddingFrame = require('./QuicPaddingFrame');
var QuicConnectionCloseFrame = require('./QuicConnectionCloseFrame');
var QuicHandshakeMessage = require('./QuicHandshakeMessage');
var QuicClientHello = require('./QuicClientHello');
var QuicNonce = require('./QuicNonce');
var QuicTag = require('./QuicTag');
var QuicServerConfig = require('./QuicServerConfig');
var QuicKeyExchange = require('./QuicKeyExchange');
var QuicEncrypter = require('./QuicEncrypter');
var QuicDecrypter = require('./QuicDecrypter');
var QuicDeltaTime = require('./QuicDeltaTime');

var QuicSession = module.exports = function QuicSession(options) {
    QuicSession.super_.call(this);

    var self = this;
    this._seqNum = new QuicSequenceNumber();
    this._packetManager = new QuicPacketManager(this);
    this._keyExchange = new QuicKeyExchange();
    this._encrypter = [new QuicEncrypter('null')];
    this._decrypter = [new QuicDecrypter('null')];
    this._qConn = new QuicConnection(options);
    this._qConn.on('negotiated', function () {
        self._versionNegotiated = true;
    });
    this._qConn.on('packet', function (packet) {
        self._processPacket(packet);
    });
    this._streams = {};
    var stream = new QuicStream(this, 1);
    this._streams[stream.id] = stream;
    this._sendClientHello();
};
util.inherits(QuicSession, events.EventEmitter);

Object.defineProperty(QuicSession.prototype, 'connection', {
    'get': function () {
        return this._qConn;
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
    packet.data = frame.getBuffer();
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
        if (frame.streamId.valueOf() === 1) {
            var hsMessage = new QuicHandshakeMessage(frame.data);
            if (hsMessage.messageTag === QuicTag.REJ) {
                if (hsMessage.tags[QuicTag.STK]) {
                    this._serverToken = hsMessage.tags[QuicTag.STK];
                }
                if (hsMessage.tags[QuicTag.SNO]) {
                    this._serverNonce = hsMessage.tags[QuicTag.SNO];
                }
                if (hsMessage.tags[QuicTag.SCFG]) {
                    this._serverConfig = new QuicServerConfig(hsMessage.tags[QuicTag.SCFG]);
                }
                if (this._serverConfig.tags[QuicTag.KEXS]) {
                    this._keyExchange.method = 'C255';
                }
                this.emit('rejected', hsMessage);
                this._sendClientHello();
                this._setupCrypto(this._serverConfig.publicKeys[0], false);
            } else if (hsMessage.messageTag === QuicTag.SHLO) {
                this.emit('established', hsMessage);
                if (hsMessage.tags[QuicTag.PUBS]) {
                    this._setupCrypto(hsMessage.tags[QuicTag.PUBS], true);
                } else {
                    this.emit('error', 'SHLO must have PUBS tag');
                }
                ////
                this.sendFrame(new QuicPingFrame());
            } else {
                console.log('unknown handshake message');
                console.log(hsMessage);
            }
        }
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
    chlo.version = this._qConn.version;
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
    var frame = new QuicStreamFrame();
    frame.data = chlo.getBuffer();
    this._streams[new QuicStreamId(1)].sendFrame(frame);
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
