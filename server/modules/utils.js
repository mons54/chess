module.exports = moduleUtils = function () {

    moduleUtils.parseSignedRequest = function (signedRequest) {

        signedRequest = signedRequest.split('.', 2);

        var encodedSig = signedRequest[0],
            payload = signedRequest[1],
            sig = moduleUtils.base64Decode(encodedSig),
            data = JSON.parse(moduleUtils.base64Decode(payload));

        if (data.algorithm && data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
            return;
        }

        var hmac = crypto.createHmac('sha256', app.facebook.secret);
        hmac.update(payload);
        var expectedSig = moduleUtils.base64Decode(hmac.digest('base64'));

        if (sig !== expectedSig) {
            return;
        }

        return data;
    };

    moduleUtils.base64Decode = function (data) {
        return new Buffer(data, 'base64').toString('ascii');
    };

    return moduleUtils;
};
