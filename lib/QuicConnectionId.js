var crypto = require('crypto');
var QuicConnectionId = module.exports = function QuicConnectionId (value) {
    if (value instanceof Buffer) {
        this._value = new Buffer(8).fill(0);
        value.copy(this._value, 0);
    } else if (value instanceof QuicConnectionId) {
        this._value = value.getBuffer();
    } else {
        this._value = crypto.randomBytes(8);
    }
};
Object.defineProperty(QuicConnectionId.prototype, 'minLen', {
    'get': function () {
        if (this._value[7] === 0 && this._value[6] === 0 && this._value[5] === 0 && this._value[4] === 0) {
            if (this._value[3] === 0 && this._value[2] === 0 && this._value[1] === 0) {
                return 1;
            } else {
                return 4;
            }
        } else {
            return 8;
        }
    }
});
QuicConnectionId.prototype.toString = function toString () {
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
QuicConnectionId.prototype.getBuffer = function getBuffer(len) {
    switch (len) {
        case 1:
        case 4:
            return new Buffer(this._value.slice(0, len));
        default:
            return new Buffer(this._value);
    }
};

