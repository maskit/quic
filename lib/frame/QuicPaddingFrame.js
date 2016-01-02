var QuicPaddingFrame = module.exports = function QuicPaddingFrame (buf) {
};
Object.defineProperty(QuicPaddingFrame.prototype, 'size', {
    'get': function () {
        return 1;
    }
});
QuicPaddingFrame.prototype.toString = function toString () {
    return 'Padding';
};
QuicPaddingFrame.prototype.getBuffer = function getBuffer() {
    return new Buffer([0x00, 0x00]);
};
