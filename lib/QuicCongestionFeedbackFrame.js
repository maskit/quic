var QuicCongestionFeedbackFrame = module.exports = function QuicCongestionFeedbackFrame (buf) {
};
Object.defineProperty(QuicCongestionFeedbackFrame.prototype, 'size', {
    'get': function () {
        return 1;
    }
});
QuicCongestionFeedbackFrame.prototype.toString = function toString () {
    return 'CongestionFeedback';
};
QuicCongestionFeedbackFrame.prototype.getBuffer = function getBuffer() {
    return new Buffer([0x20]);
};

