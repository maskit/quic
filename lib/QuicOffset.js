var QuicOffset = module.exports = function QuicOffset () {
    this._value = new Buffer(8).fill(0);
};
Object.defineProperty(QuicOffset.prototype, 'minLen', {
    'get': function () {
        var i;
        for (i = 7; i >= 0; --i) {
            if (this._value[i] !== 0) {
                return i + 1;
            }
        }
        return 0;
    }
});
QuicOffset.prototype.toString = function toString () {
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
QuicOffset.prototype.increment = function increment (v) {
    var i, n = this._value.length, carry = 0;
    if (typeof v === 'undefined') {
        v = 1;
    }
    x = new Buffer(4).fill(0);
    x.writeUInt32LE(v);
    for (i = 0; i < 4; ++i) {
        if (this._value[i] + x[i] + carry > 255) {
            this._value[i] += x[i] + carry;
            carry = 1;
        } else {
            this._value[i] += x[i] + carry;
            carry = 0;
        }
    }
    for (; i < n; ++i) {
        if (this._value[i] + carry > 255) {
            this._value[i] += carry;
            carry = 1;
        } else {
            this._value[i] += carry;
            carry = 0;
        }
    }
};
QuicOffset.prototype.set = function set (offset) {
    offset.getBuffer().copy(this._value, 0);
};
QuicOffset.prototype.getBuffer = function getBuffer(len) {
    switch (len) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
            return new Buffer(this._value.slice(0, len));
        default:
            return new Buffer(this._value);
    }
};
