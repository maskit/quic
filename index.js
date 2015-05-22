var url = require('url');
var http = require('http');
var dgram = require('dgram');
var QuicSession = require('./lib/QuicSession');


function getAltProtocols (url, callback) {
    var protocols = {} ;

    http.get(url ,function (res) {
        var altProtocols = res.headers['alternate-protocol'];
        altProtocols.split(', ').forEach(function (range, i) {
            var protocol = '', parameters = '';
            var paramPos = range.indexOf(',');
            if (paramPos > 0) {
                protocol = range.substring(0, paramPos);
                parameters = range.substring(paramPos + 1);
            } else {
                protocol = range;
            }
            var colonPos = protocol.indexOf(':');
            protocols[protocol.substring(0, colonPos)] = {
                'protocol': protocol.substring(colonPos + 1),
                'parameters': parameters
            };
        });
        callback(false, protocols);
    }).on('error', function (e)  {
        callback(e);
    });
}

function getQuicPort(protocols) {
    for (var port in protocols) {
        if (protocols[port].protocol == 'quic') {
            return port;
        }
    }
}

var target = 'http://www.google.com/';
// var target = 'http://localhost/';
getAltProtocols(target, function (err, protocols) {
    var host, port;
    if (err) {
        host = url.parse(target).hostname;
        port = 6121;
    } else {
        host = url.parse(target).hostname;
        port = getQuicPort(protocols);
    }

    var qSession = new QuicSession({
        'host': host,
        'port': port,
    });
    qSession.on('error', function (e) {
        console.log(e);
    });
    qSession.on('frame', function (frame) {
        console.log('>> ' + frame.toString());
    });
    qSession.on('sent', function (frame) {
        console.log('<< ' + frame.toString());
    });
    qSession.on('rejected', function (hsMessage) {
        console.log('## rejected');
        // console.log(hsMessage);
    });
    qSession.on('established', function (hsMessage) {
        console.log('## established');
        // console.log(hsMessage);
    });
    qSession.connection.on('packet', function (packet) {
        // console.log(packet.toString());
    });
    qSession.connection.on('negotiating', function (versions) {
        console.log('## QUIC Version candidates: ' + versions);
    });
    qSession.connection.on('negotiated', function (version) {
        console.log('## QUIC Version negotiated: ' + version);
    });
});
