module.exports = function (app, mongoose, crypto) {

    var security_token = '911f3fd471bdb649c9beb94631edf75a';

    var users = mongoose.models.users,
        sponsorpay = mongoose.models.sponsorPay;

    app.get('/sponsorpay', function (req, res) {

        var response = "HTTP/1.0 400 Bad Request: wrong SID";

        var sid = req.param('sid'),
            amount = req.param('amount'),
            uid = req.param('uid'),
            transid = req.param('_trans_id_');

        if (sid && amount && uid && transid) {

            var hash = crypto.createHash('sha1');
            hash.update(security_token + uid + amount + transid);
            var sha1Data = hash.digest('hex');

            if (sid == sha1Data) {

                response = "HTTP200";

                sponsorpay.count({
                    id: transid
                }, function (err, nb) {

                    if (err || nb) return;

                    var trans = new sponsorpay({
                        id: transid
                    });
                    trans.uid = uid;
                    trans.amount = amount;

                    trans.save();

                    users.find({
                        uid: uid
                    }, function (err, data) {

                        if (err || !data[0]) {
                            return;
                        }

                        var token = parseInt(data[0].tokens) + parseInt(amount);

                        users.update({
                            uid: uid
                        }, {
                            $set: {
                                tokens: token
                            }
                        }, function (err) {});
                    });
                });
            }
        }

        res.send(response);
    });
};
