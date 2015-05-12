var dgram = require('dgram');
var events = require('events');
var util = require('util');
var QuicPacket = require('./QuicPacket');
var QuicConnectionId = require('./QuicConnectionId');
var QuicPacketPublicHeader = require('./QuicPacketPublicHeader');
var QuicVersionNegotiationPacket = require('./QuicVersionNegotiationPacket');
var QuicConnectionState = require('./QuicConnectionState');

var acceptableVersions = [
    // new Buffer('Q015'),
    new Buffer('Q025'), // this should be selected
    new Buffer('Q024'),
];

var QuicConnection = module.exports = function QuicConnection (options) {
    events.EventEmitter.call(this);

    this._currentVersionIndex = 0;
    this._id = new QuicConnectionId();

    this._state = QuicConnectionState.NEGOTIATING_VERSION;

    var self = this;
    this._host = options.host;
    this._port = options.port;

    this._socket = dgram.createSocket('udp4');
    this._socket.on('message', function (msg, rinfo) {
        if (self._state === QuicConnectionState.NEGOTIATING_VERSION) {
            if ((new QuicPacketPublicHeader(msg)).hasVersion) {
                var versions = (new QuicVersionNegotiationPacket(msg)).versions;
                self.emit('negotiating', versions);
                if (versions.every(function (va, i) {
                    if (acceptableVersions.every(function (vb, i) {
                        if (va.equals(vb)) {
                            self._currentVersionIndex = i;
                            return false;
                        } else {
                            return true;
                        }
                    })) {
                        return true;
                    } else {
                        return false;
                    }
                })) {
                    self.emit('error', new Error('Version negotiation broke down. The server expects: ' + versions));
                } else {
                    self.sendPacket(new QuicPacket());
                }
                return;
            } else {
                self._state = QuicConnectionState.ESTABLISHED;
                self.emit('negotiated', acceptableVersions[self._currentVersionIndex]);
            }
        }
        var packet = new QuicPacket(msg);
        self.emit('packet', packet);
    });
    this._socket.on('error', function (e) {
        self.emit('error', e);
    });
};
util.inherits(QuicConnection, events.EventEmitter);
Object.defineProperty(QuicConnection.prototype, 'version', {
    'get': function () {
        return acceptableVersions[this._currentVersionIndex];
    }
});
Object.defineProperty(QuicConnection.prototype, 'id', {
    'get': function () {
        return this._id;
    }
});
QuicConnection.prototype.send = function send (data, callback) {
    var packet = new QuicPacket();
    packet.payload = data;
    this.sendPacket(packet, callback);
};
QuicConnection.prototype.sendPacket = function sendPacket (packet, callback) {
    var data = packet.getBuffer();
    this._socket.send(data, 0, data.length, this._port, this._host, callback);
};
