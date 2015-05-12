
var QuicPacketManager = module.exports = function QuicPacketManager (session) {
    var self = this;

    this._session = session;
    this._baseTime = Date.now();
    this._lgtObservedNumber = null;
    this._lgtObservedTime = null;
    this._receivedEntropy = 0;

    session.on('packetSent', function onPacketProcessed (packet) {
    });
    session.on('packetProcessed', function onPacketProcessed (packet) {
        self._receivedEntropy ^= calcContribution(packet);
        self._lgtObservedTime = Date.now();
        self._lgtObservedNumber = packet.sequenceNumber;
    });
};
Object.defineProperty(QuicPacketManager.prototype, 'receivedEntropy', {
    'get': function () {
        return this._receivedEntropy;
    }
});
Object.defineProperty(QuicPacketManager.prototype, 'largestObservedSeqNum', {
    'get': function () {
        return this._lgtObservedNumber;
    }
});

function calcContribution (packet) {
    if (packet.hasEntropy) {
        return 1 << (packet.sequenceNumber.getBuffer(1)[0] & 0x07);
    } else {
        return 0;
    }
}
