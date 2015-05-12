var QuicPingFrame = module.exports = function QuicPingFrame (buf) {
};
Object.defineProperty(QuicPingFrame.prototype, 'size', {
    'get': function () {
        return 1;
    }
});
QuicPingFrame.prototype.toString = function toString () {
    return 'Ping';
};
QuicPingFrame.prototype.getBuffer = function getBuffer() {
    return new Buffer([0x07]);
};
