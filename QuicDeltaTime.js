var QuicDeltaTime = module.exports = function QuicDeltaTime () {
    switch (arguments.length) {
        case 0:
            this._value = new Buffer([0x00, 0x00]);
            break;
        case 1: // (buf)
            this._value = new Buffer(arguments[0]);
            break;
        case 2: // (from, to)
            var dt = arguments[1] - arguments[0];
            // TODO calc 16 bit unsigned float
            this._value = new Buffer([0xFF, 0xFF]);
            break;
    }
};
