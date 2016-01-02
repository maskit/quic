var urlUtil = require('url');
var QuicSession = require('./lib/QuicSession');

var h2q = module.exports = function h2q (qSession) {
    this._qSession = qSession;
};

h2q.prototype.connect = function connect (host, port, callback) {
    var self = this;
    if (this._qSession) {
        if (this._qSession.established) {
            this._qSession.headersStream.on('headers', function (h) { console.log(h); });
            callback();
        } else {
            this._qSession.on('established', callback);
            this._qSession.headersStream.on('headers', function (h) { console.log(h); });
        }
    } else {
        this._qSession = new QuicSession({
            'host': host,
            'port': port,
        });
        this._qSession.on('established', callback);
        this._qSession.headersStream.on('headers', function (h) { console.log(h); });
    }
};
h2q.prototype.get = function get (url) {
    var self = this;
    url = urlUtil.parse(url);
    this.connect(url.hostname, url.port, function () {
        var headers = [
            [':method', 'GET'],
            [':scheme', url.protocol.substring(0, url.protocol.length - 1)],
            [':authority', url.hostname + (url.port ? ':' + url.port : '')],
            [':path', url.pathname],
        ];
        var stream = self._qSession.headersStream.sendHeaders(headers, function () {
            console.log(headers);
        });
        stream.on('data', function (data) {
            console.log(data.toString());
        });
    });
};
