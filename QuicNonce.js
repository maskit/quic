var crypto = require('crypto');

module.exports.generate = function generate (orbit) {
    var buf = new Buffer(32);
    buf.writeUInt32BE(Math.floor(Date.now() / 1000), 0);
    orbit.copy(buf, 4);
    crypto.randomBytes(20).copy(buf, 12);
    return buf;
};
