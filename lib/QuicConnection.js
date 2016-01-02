var dgram = require('dgram');
var events = require('events');
var util = require('util');
var QuicPacket                   = require('./packet/QuicPacket');
var QuicPacketPublicHeader       = require('./packet/QuicPacketPublicHeader');
var QuicVersionNegotiationPacket = require('./packet/QuicVersionNegotiationPacket');
var QuicConnectionId = require('./QuicConnectionId');
var QuicConnectionState = require('./QuicConnectionState');

var acceptableVersions = [
    new Buffer('Q025'), // this should be selected
    new Buffer('Q026'),
];

function selectVersion (versions) {
    var selected = null;
    versions.every(function (va, i) {
        if (acceptableVersions.every(function (vb, i) {
            if (va.equals(vb)) {
                selected = i;
                return false;
            } else {
                return true;
            }
        })) {
            return true;
        } else {
            return false;
        }
    });
    return selected;
}

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
        var publicHeader = new QuicPacketPublicHeader(msg);
        if (publicHeader.isPublicResetPacket) {
            self.emit('unsupported', "Public Reset Packet");
        } else if (publicHeader.hasVersion) {
            var versions = (new QuicVersionNegotiationPacket(msg)).versions;
            self.emit('negotiating', versions);
            var v = selectVersion(versions);
            if (v === null) {
                self.emit('error', new Error('Version negotiation broke down. The server expects: ' + versions));
            } else {
                self._currentVersionIndex = v;
                self.sendPacket(new QuicPacket());
            }
        } else {
            if (self._state === QuicConnectionState.NEGOTIATING_VERSION) {
                self._state = QuicConnectionState.ESTABLISHED;
                self.emit('negotiated', acceptableVersions[self._currentVersionIndex]);
            }
            var packet = new QuicPacket(msg);
            self.emit('packet', packet);
        }
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
Object.defineProperty(QuicConnection.prototype, 'host', {
    'get': function () {
        return this._host;
    }
});
Object.defineProperty(QuicConnection.prototype, 'port', {
    'get': function () {
        return this._port;
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
