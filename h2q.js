var urlUtil = require('url');
var HPACK = require('hpack');
var QuicSession = require('./lib/QuicSession');
var QuicStreamFrame = require('./lib/QuicStreamFrame');

var h2q = module.exports = function h2q (qSession) {
    this._qSession = qSession;
    this._hpack = new HPACK();
};

h2q.prototype._printFrame = function (f) {
    if (f instanceof QuicStreamFrame) {
        if (f.streamId.valueOf() === 3) {
            console.log(this._hpack.decode(f.data.slice(9)));
        } else if (f.streamId.valueOf() >= 5) {
            console.log(f.data.toString());
        }
    }
};

h2q.prototype.connect = function connect (host, port, callback) {
    var self = this;
    if (this._qSession) {
        if (this._qSession.established) {
            this._qSession.on('frame', function (f) { self._printFrame(f); });
            callback();
        } else {
            this._qSession.on('established', callback);
            this._qSession.on('frame', function (f) { self._printFrame(f); });
        }
    } else {
        this._qSession = new QuicSession({
            'host': host,
            'port': port,
        });
        this._qSession.on('established', callback);
        this._qSession.on('frame', function (f) { self._printFrame(f); });
    }
};
h2q.prototype.get = function get (url) {
    var self = this;
    url = urlUtil.parse(url);
    this.connect(url.hostname, url.port, function () {
        var stream = self._qSession.createStream();
        var headers = [
            [':method', 'GET'],
            [':scheme', url.protocol.substring(0, url.protocol.length - 1)],
            [':authority', url.hostname + (url.port ? ':' + url.port : '')],
            [':path', url.pathname],
        ];
        var frame = new QuicStreamFrame();
        var h2FrameHeader = new Buffer(9);
        h2FrameHeader[3] = 0x01; // h2 frame type
        h2FrameHeader[4] = 0x25; // h2 frame flag
        h2FrameHeader.writeUIntBE(stream.id.valueOf(), 5, 4); // stream id
        var h2HeadersFrameHeader = new Buffer([
            0x00, 0x00, 0x00, 0x00, // dependency
            0x01, // weight
        ]);
        var h2HeadersBlock = self._hpack.encode(headers);
        h2FrameHeader.writeUIntBE(h2HeadersFrameHeader.length + h2HeadersBlock.length , 0, 3);
        frame.data = Buffer.concat([
            h2FrameHeader,
            h2HeadersFrameHeader,
            h2HeadersBlock
        ]);
        self._qSession.headersStream.sendFrame(frame, function () {
            console.log(headers);
        });
    });
};
