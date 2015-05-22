var QuicConnectionId = require('./QuicConnectionId');
var QuicSequenceNumber = require('./QuicSequenceNumber');

var QuicPacketPublicHeader = module.exports = function QuicPacketPublicHeader (buf) {
    this._publicFlags = 0x3C;
    this._connectionId = new QuicConnectionId();
    this._sequenceNumber = new QuicSequenceNumber();
    this._version = new Buffer(4).fill(0);

    if (buf) {
        if ((buf[0] & 0xC0) !== 0) {
            throw new Error('invalid packet data');
        }
        this._publicFlags = buf[0];
        if (this.connectionIdLen) {
            this._connectionId = new QuicConnectionId(buf.slice(1, 1 + this.connectionIdLen));
        }
        if (this.hasVersion) {
            var versionStart = 1 + this.connectionIdLen;
            buf.copy(this._version, 0, versionStart, versionStart + 4);
        }
        var seqNumStart = 1 + this.connectionIdLen + (this.hasVersion ? 4 : 0);
        this._sequenceNumber = new QuicSequenceNumber(buf.slice(seqNumStart, seqNumStart + this.sequenceNumLen));
    }
};
Object.defineProperty(QuicPacketPublicHeader.prototype, 'connectionId', {
    'get': function () {
        if (this.connectionIdLen) {
            return this._connectionId;
        } else {
            return void(0);
        }
    },
    'set': function (id) {
        this._connectionId = new QuicConnectionId(id);
    }
});
Object.defineProperty(QuicPacketPublicHeader.prototype, 'sequenceNumber', {
    'get': function () {
        return this._sequenceNumber;
    },
    'set': function (seqNum) {
        this._sequenceNumber.set(seqNum);
        switch (this._sequenceNumber.minLen) {
            case 1:
                this._publicFlags = this._publicFlags & ~0x30;
                break;
            case 2:
                this._publicFlags = this._publicFlags & ~0x30 | 0x10;
                break;
            case 4:
                this._publicFlags = this._publicFlags & ~0x30 | 0x20;
                break;
            case 6:
                this._publicFlags = this._publicFlags & ~0x30 | 0x30;
                break;
        }
    }
});
Object.defineProperty(QuicPacketPublicHeader.prototype, 'version', {
    'get': function () {
        if (this.hasVersion) {
            return this._version;
        } else {
            return void(0);
        }
    },
    'set': function (v) {
        this._publicFlags |= 0x01;
        v.copy(this._version, 0);
    }
});
Object.defineProperty(QuicPacketPublicHeader.prototype, 'size', {
    'get': function () {
        var size = 0;
        size += 1; // PublicFlags
        size += this.connectionIdLen;
        size += this.hasVersion ? 4 : 0;
        size += this.sequenceNumLen;
        return size;
    }
});
Object.defineProperty(QuicPacketPublicHeader.prototype, 'connectionIdLen', {
    'get': function () {
        switch (this._publicFlags & 0x0C) {
            case 0x0C:
                return 8;
            case 0x08:
                return 4;
            case 0x04:
                return 1;
            case 0x00:
                return 0;
        }
    }
});
Object.defineProperty(QuicPacketPublicHeader.prototype, 'sequenceNumLen', {
    'get': function () {
        switch (this._publicFlags & 0x30) {
            case 0x30:
                return 6;
            case 0x20:
                return 4;
            case 0x10:
                return 2;
            case 0x00:
                return 1;
        }
    }
});
Object.defineProperty(QuicPacketPublicHeader.prototype, 'hasVersion', {
    'get': function () {
        return (this._publicFlags & 0x01) !== 0;
    }
});
Object.defineProperty(QuicPacketPublicHeader.prototype, 'isPublicResetPacket', {
    'get': function () {
        return (this._publicFlags & 0x02) !== 0;
    }
});
QuicPacketPublicHeader.prototype.toString = function toString () {
    var str = '';
    str += 'Public Flags:' + "\n";
    str += ' VERSION: ' + this.hasVersion + "\n";
    str += ' PUBLIC RESET: ' +  this.isPublicResetPacket + "\n";
    str += ' SIZE OF CONNECTION ID: ' + this.connectionIdLen + "\n";
    str += ' NUMBER OF BYTES OF SEQ#: ' + this.sequenceNumLen + "\n";
    str += 'Connection ID: ' + this.connectionId.toString() + "\n";
    str += 'Sequence Number: ' + this.sequenceNumber;
    return str;
};
