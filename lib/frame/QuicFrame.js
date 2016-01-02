var QuicFrame = module.exports = function QuicFrame (buf, packet) {
    if (packet) {
        this._packet = packet;
    }
};

QuicFrame.create = function create (buf, packet) {
    var frameType, instance;

    if (buf[0] > 0x20) {
        if ((buf[0] & 0x80) !== 0) {
            frameType = 'Stream';
        } else if ((buf[0] & 0x40) !== 0) {
            frameType = 'Ack';
        } else if ((buf[0] & 0x20) !== 0) {
            frameType = 'CongestionFeedback';
        }
    } else {
        frameType = getTypeById(buf[0]);
    }
    if (frameType) {
        var klass = require('./Quic' + frameType + 'Frame');
        if (klass) {
            instance = new klass(buf, packet);
        }
    }
    return instance;
};

function getTypeById(id) {
    return frameTypes[id];
}

var frameTypes = [
    'Padding',
    'RstStream',
    'ConnectionClose',
    'Goaway',
    'WindowUpdate',
    'Blocked',
    'StopWaiting',
    'Ping',
];
