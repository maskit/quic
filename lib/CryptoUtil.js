var fnv = require('fnv-plus');

module.exports = {
    fnvHash: function (data1, data2) {
        var buf = Buffer.concat([data1, data2]).toString('binary');
        return new Buffer(fnv.hash(buf, 128).value.toByteArray().slice(-12).reverse());
    }
};
