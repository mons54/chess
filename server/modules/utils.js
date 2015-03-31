module.exports = function () {

    this.parseSignedRequest = function (signedRequest) {

        signedRequest = signedRequest.split('.', 2);

        var encodedSig = signedRequest[0],
            payload = signedRequest[1],
            sig = this.base64Decode(encodedSig),
            data = JSON.parse(this.base64Decode(payload));

        if (data.algorithm && data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
            return;
        }

        var hmac = crypto.createHmac('sha256', app.facebook.secret);
        hmac.update(payload);
        var expectedSig = this.base64Decode(hmac.digest('base64'));

        if (sig !== expectedSig) {
            return;
        }

        return data;
    };

    this.base64Decode = function (data) {
        return new Buffer(data, 'base64').toString('ascii');
    };

    this.getFreeTime = function (time) {
        return (3600 * 24) - (Math.round(new Date().getTime() / 1000) - time);
    };

    this.fn = function () {

    };

    return this;
}();
