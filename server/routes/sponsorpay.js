module.exports = function (app, mongoose, crypto) {

    var security_token = '911f3fd471bdb649c9beb94631edf75a';

    app.get('/sponsorpay', function (req, res) {

        var response = "HTTP/1.0 400 Bad Request: wrong SID";

        var sid = req.param('sid'),
            amount = req.param('amount'),
            uid = req.param('uid'),
            transid = req.param('_trans_id_');

        if (!sid || !amount || !uid || !transid) {
            res.send(response);
            return;
        }


        var hash = crypto.createHash('sha1');
        hash.update(security_token + uid + amount + transid);
        var sha1Data = hash.digest('hex');

        if (sid !== sha1Data) {
            res.send(response);
            return;
        }

        mongoose.promise.count('sponsorPay', { id: transid })
        .then(function (data) {
            if (data) {
                res.send(response);
                this.finally;
            }

            mongoose.promise.save('sponsorPay', { id: transid, uid: uid, amount: amount });

            return mongoose.promise.find('users', { uid: uid });
        })
        .then(function (data) {
            if (!data[0]) {
                res.send(response);
                this.finally;
            }

            var tokens = parseInt(data[0].tokens) + parseInt(amount);

            mongoose.promise.update('users', { uid: uid }, { tokens: tokens });

            res.send("HTTP200");
        })
        .catch(function () {
            res.send(response);
        });
    });
};
