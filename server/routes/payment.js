module.exports = function (app, mongoose, fbgraph, crypto) {

    var securityToken = '911f3fd471bdb649c9beb94631edf75a';

    app.all('/payments', function (req, res) {

        var response = 'HTTP/1.0 400 Bad Request';

        if (!req.query) {
            res.send(response);
            return;
        }

        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === securityToken) {
            response = req.query['hub.challenge'];
            res.send(response);
            return;
        }

        if (!req.headers['x-hub-signature'] || !req.body.entry || !req.body.entry[0] || !req.body.entry[0].id) {
            res.send(response);
            return;
        }

        var paymentId = req.body.entry[0].id;

        var signature = req.headers['x-hub-signature'].substr(5),
            query = JSON.stringify(req.body);

        var hmac = crypto.createHmac('sha1', app.facebook.secret);
        hmac.update(query);
        var calculatedSecret = hmac.digest('hex');

        if (signature != calculatedSecret) {
            res.send(response);
            return;
        }

        fbgraph.promise.post('/oauth/access_token?client_id=' + app.facebook.appId + '&client_secret=' + app.facebook.secret + '&grant_type=client_credentials')
        .then(function (data) {
            if (!data.access_token) {
                res.send(response);
                this.finally;
            }

            return fbgraph.promise.get('/' + paymentId + '?access_token=' + data.access_token);
        })
        .then(function (data) {
            if (!data.id || !data.user || !data.actions) {
                res.send(response);
                this.finally;
            }

            this.type = '';
            this.status = '';

            for (var i in data.actions) {
                this.type = data.actions[i].type;
                this.status = data.actions[i].status;
            }

            if (this.type == 'charge' && this.status == 'failed') {
                res.send('HTTP/1.0 200 OK');
                this.finally;
            }

            this.amount = parseInt(data.actions[0].amount);

            if (!app.itemsAmount[this.amount]) {
                res.send(response);
                this.finally;
            }

            this.data = data;

            return mongoose.promise.find('payments', { id: data.id });
        })
        .then(function (data) {
            if (!data[0]) {
                this.action = 'save';
            } else if (this.type === 'refund' && this.type !== data[0].type && this.status !== 'completed' && this.status !== data[0].status) {
                this.action = 'update';
            } else {
                res.send('HTTP/1.0 200 OK');
                this.finally;
            }

            return mongoose.promise.find('users', { uid: this.data.user.id });
        })
        .then(function (data) {
            if (err || !data[0] || !data[0].tokens) {
                res.send(response);
                this.finally;
            }

            this.tokens = parseInt(data[0].tokens) + parseInt(app.itemsAmount[this.amount].tokens);

            if (this.action === 'save') {
                return mongoose.promise.save('payments', {
                    id: this.data.id,
                    uid: this.data.user.id,
                    item: app.itemsAmount[this.amount].item,
                    type: 'charge',
                    status: 'completed',
                    time: Math.round(new Date() / 1000),
                });
            } else {
                return mongoose.promise.update('payments', { id: this.data.id }, { type: 'refund', status: 'completed' });
            }
        })
        .then(function (data) {
            return mongoose.promise.update('users', { uid: this.data.user.id }, { tokens: this.tokens });
        })
        .then(function (data) {
            res.send('HTTP/1.0 200 OK');
        })
        .catch(function (error) {
            res.send(response);
        });
    });
};
