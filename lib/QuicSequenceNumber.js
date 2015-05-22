var QuicSequenceNumber = module.exports = function QuicSequenceNumber (buf) {
    this._value = new Buffer([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    if (buf) {
        buf.copy(this._value, 0);
    }
};
Object.defineProperty(QuicSequenceNumber.prototype, 'minLen', {
    'get': function () {
        if (this._value[5] === 0 && this._value[4] === 0) {
            if (this._value[3] === 0 && this._value[2] === 0) {
                if (this._value[1] === 0) {
                    return 1;
                } else {
                    return 2;
                }
            } else {
                return 4;
            }
        } else {
            return 6;
        }
    }
});
QuicSequenceNumber.prototype.toString = function toString () {
    var str = '0x';
    var i, n = this.minLen - 1;
    for (i = n; i >= 0; --i) {
        if (this._value[i] < 16) {
            str += '0';
        }
        str += this._value[i].toString(16);
    }
    return str;
};
QuicSequenceNumber.prototype.increment = function increment () {
    var i, n = this._value.length;
    for (i = 0; i < n; i++) {
        if (this._value[i] === 255) {
            this._value[i] = 0;
        } else {
            this._value[i]++;
            break;
        }
    }
};
QuicSequenceNumber.prototype.set = function set (seqNum) {
    seqNum.getBuffer().copy(this._value, 0);
};
QuicSequenceNumber.prototype.getBuffer = function getBuffer(len) {
    switch (len) {
        case 1:
        case 2:
        case 4:
        case 6:
            return new Buffer(this._value.slice(0, len));
        default:
            return new Buffer(this._value);
    }
};
