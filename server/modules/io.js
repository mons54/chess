module.exports = function (app, io, mongoose, fbgraph, crypto) {

    var moduleSocket = require(dirname + '/server/modules/socket')(io, mongoose),
        moduleGame = require(dirname + '/server/modules/game')(moduleSocket),
        moduleUtils = require(dirname + '/server/modules/utils');

    io.on('connection', function (socket) {

        socket.on('init', function (data) {

            if (!data.uid || !data.accessToken) {
                moduleSocket.disconnectSocket(socket);
                return;
            }

            fbgraph.post('/' + data.uid + '?access_token=' + data.accessToken, function(err, res) {
                if (err || !res.success) {
                    moduleSocket.disconnectSocket(socket);
                    return;
                }
                moduleSocket.init(socket, data, err, res);
            });
        });

        socket.on('initUser', function () {
            moduleSocket.initUser(socket);
        });

        socket.on('createGame', function (data) {

            if (!data || !moduleSocket.checkSocketUid(socket) || !moduleGame.create(socket, data)) {
                return;
            }

            moduleGame.listGames();
        });

        socket.on('removeGame', function () {
            if (!moduleSocket.checkSocketUid(socket)) {
                return;
            }
            
            moduleGame.deleteCreatedGame(socket.uid);
        });

        socket.on('startGame', function (uid) {
            console.log(uid);
        });

        socket.on('challenge', function (data) {

            var socketOpponent = moduleSocket.getSocket(data.uid),
                color = data.color,
                time = moduleGame.getTime(data.time);

            if (!moduleSocket.checkSocketUid(socket) || !socketOpponent || !moduleGame.checkColor(color) || !moduleGame.checkColor(color)) {
                return;
            }

            moduleSocket.setChallenges(socketOpponent, socket.uid, {
                create: false,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking,
                color: color,
                time: time
            });

            moduleSocket.setChallenges(socket, data.uid, {
                create: true,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking,
                color: color,
                time: time
            });

            socketOpponent.emit('challenges', socketOpponent.challenges);
            socket.emit('challenges', socket.challenges);
        });

        socket.on('removeChallenge', function (uid) {
            if (moduleSocket.checkSocketUid(socket)) {
                moduleSocket.deleteChallenge(moduleSocket.getSocket(uid), socket.uid);
            }
            moduleSocket.deleteChallenge(socket, uid);
        });

        socket.on('newGame', function (data) {
            var game = moduleGame.start(data.white, data.black, data.time);

            socket.gid = game.id;

            socket.emit('game', game);
        });

        socket.on('move', function (data) {

            if (!socket.gid) {
                return;
            }

            var game = moduleGame.move(socket.gid, data.start, data.end, null);
            
            socket.emit('game', game);
        });

        socket.on('leaveHome', function () {

            if (!moduleSocket.checkSocketUid(socket)) {
                return;
            }

            socket.leave('home');

            moduleSocket.listChallengers();

            moduleGame.deleteCreatedGame(socket.uid);

            moduleSocket.deleteChallenges(socket);
        });

        socket.on('ranking', function (data) {
            if (!moduleSocket.checkSocketUid(socket)) {
                return;
            }

            var uid = socket.uid,
                limit = 8,
                page = parseInt(data.page),
                friends = data.friends;

            if (page) {
                if (page <= 0) {
                    page = 1;
                }
                moduleSocket.initRanking(socket, friends, page, limit, false);
            } else {
                var points = socket.points,
                    request = {
                        actif: 1,
                        points: {
                            $gt: points
                        }
                    };

                if (friends) {
                    request = {
                        actif: 1,
                        uid: {
                            $in: friends
                        },
                        points: {
                            $gt: points
                        }
                    };
                }

                mongoose.models.users.count(request, function (err, count) {

                    if (err) {
                        return;
                    }

                    count++;

                    var page = Math.ceil(count / limit);

                    if (page <= 0) {
                        page = 1;
                    }

                    moduleSocket.initRanking(socket, friends, page, limit, true);
                });
            }
        });

        socket.on('payment', function (data) {

            if (!moduleSocket.checkSocketUid(socket) || !data.signed_request) {
                return;
            }

            var request = moduleUtils.parseSignedRequest(data.signed_request),
                item    = app.itemsAmount[parseFloat(request.amount)];

            if (!request || !item) {
                return;
            }

            mongoose.models.users.findOne({
                uid: socket.uid
            }, 'tokens', function (err, data) {

                if (err || !data) {
                    return;
                }

                token = parseInt(data.tokens) + parseInt(item.tokens);

                new mongoose.models.payments({
                    id: request.payment_id,
                    uid: socket.uid,
                    item: item.item,
                    type: 'charge',
                    status: 'completed',
                    time: request.issued_at,
                }).save(function (err, res) {
                    if (err) {
                        return;
                    }
                    mongoose.models.users.update({ uid: socket.uid }, { $set: { tokens: token } }, function (err) {
                        if (err) {
                            return;
                        }
                        moduleSocket.initUser(socket);
                    });
                });   
            });
        });

        socket.on('disconnect', function () {

            if (moduleSocket.checkSocketUid(socket)) {
                delete moduleSocket.connected[socket.uid];
                moduleGame.deleteCreatedGame(socket.uid);
            }

            moduleSocket.deleteChallenges(socket);
        });
    });
};
