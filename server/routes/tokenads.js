module.exports = function (app, mongoose, crypto) {

    var secret = '9ee29ed8c42efb22';

    var users = mongoose.models.users,
        tokenads = mongoose.models.tokenAds;

    app.get('/tokenads', function (req, res) {

        var response = "HTTP/1.0 400 Bad Request: wrong SID";

        var uid = req.param('clientid'),
            mt = req.param('mt'),
            vkey = req.param('vkey');

        if (uid && mt && vkey) {

            var hash = crypto.createHash('md5');
            hash.update(uid + mt + secret);
            var cmpVkey = hash.digest('hex');

            if (cmpVkey == vkey) {

                var amount = req.param('award');

                response = "200 OK";

                tokenads.count({
                    id: vkey
                }, function (err, nb) {

                    if (err || nb) return;

                    new tokenads({
                        id: vkey,
                        uid: uid,
                        amount: amount
                    }).save();

                    users.find({
                        uid: uid
                    }, function (err, data) {

                        if (err || !data[0]) return;

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
