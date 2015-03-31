module.exports = moduleSocket = function (app, io, mongoose, fbgraph, crypto) {

    moduleGame = require(dirname + '/server/modules/game')(moduleSocket);
    moduleUtils = require(dirname + '/server/modules/utils');

    moduleSocket.connected = {};

    moduleSocket.listGames = function () {
        this.sendHome('listGames', moduleGame.createdGame);
    };

    moduleSocket.sendHome = function (name, data) {
        io.sockets.to('home').emit(name, data);  
    };

    moduleSocket.setChallenges = function (socket, key, value) {
        if (!socket.challenges) {
            socket.challenges = {};
        }

        socket.challenges[key] = value;
    };

    moduleSocket.deleteChallenges = function (socket) {
        if (!moduleSocket.checkSocketUid(socket) || !socket.challenges) {
            return;
        }

        for (var uid in socket.challenges) {
            moduleSocket.deleteChallenge(moduleSocket.getSocket(uid), socket.uid);
        }

        delete socket.challenges;
    };

    moduleSocket.deleteChallenge = function (socket, uid) {

        if (!socket || !socket.challenges || !socket.challenges[uid]) {
            return;
        }

        delete socket.challenges[uid];
        socket.emit('challenges', socket.challenges);
    }

    moduleSocket.getSocket = function (uid) {
        var id = moduleSocket.connected[uid],
            socket = null;
        if (!id) {
            return socket;
        }
        
        io.sockets.sockets.forEach(function (value) {
            if (id === value.id) {
                socket = value;
                return;
            }
        });

        return socket;
    };

    moduleSocket.checkSocketUid = function (socket) {
        if (!socket.uid) {
            moduleSocket.disconnectSocket(socket);
            return false;
        }
        return true;
    };

    moduleSocket.disconnectSocket = function (socket) {
        socket.disconnect();
    };

    moduleSocket.listChallengers = function () {

        var challengers = [];

        io.sockets.sockets.forEach(function (socket) {
            if (!socket.uid || !socket.rooms || socket.rooms.indexOf('home') === -1) {
                return;
            }
            challengers.push({
                uid: socket.uid,
                name: socket.name,
                ranking: socket.ranking,
                points: socket.points
            });
        });

        io.sockets.to('home').emit('challengers', challengers);
    };

    moduleSocket.connected = function () {
        io.sockets.emit('connected', io.sockets.sockets.length);
        moduleSocket.listChallengers();
    };

    moduleSocket.initRanking = function (socket, friends, page, limit, getUser) {

        var offset = (page * limit) - limit,
            request;

        if (getUser) {
            request = moduleSocket.getRequestRankingWithUser(socket, friends);
        } else {
            request = moduleSocket.getRequestRankingWithoutUser(friends);
        }

        users.count(request, function (err, count) {

            if (err) {
                return;
            }

            if (count == 0) {

                var data = [];
                data.push({
                    uid: socket.uid,
                    points: socket.points,
                    position: 1
                });

                socket.emit('ranking', {
                    ranking: data
                });

                return;
            }

            if (getUser) {
                count++;
                limit = limit - 1;
            }

            users.find(request).sort({
                points: -1
            }).skip(offset).limit(limit).hint({
                points: 1
            }).exec(function (err, data) {
                if (err || !data[0] || !data[0].points) {
                    return;
                }

                moduleSocket.getRanking(socket, data, count, friends, offset, limit, getUser);
            });
        });
    };

    moduleSocket.getRanking = function(socket, data, total, friends, offset, limit, getUser) {
        
        var points = (getUser && socket.points > data[0].points) ? socket.points : data[0].points,
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

        users.count(request, function (err, count) {

            var position = count + 1,
                request = {
                    actif: 1,
                    points: data[0].points
                };

            if (friends) {
                request = {
                    actif: 1,
                    uid: {
                        $in: friends
                    },
                    points: data[0].points
                };
            }

            users.count(request, function (err, count) {

                var current = 0,
                    result = [],
                    ranking = {},
                    value;

                if (getUser) {

                    var saveUser = false;

                    for (var i in data) {

                        if (!saveUser && socket.points >= data[i].points) {
                            result.push({
                                uid: socket.uid,
                                points: socket.points,
                            });

                            saveUser = true;
                        }

                        result.push(data[i]);
                    }

                    if (!saveUser) {
                        result.push({
                            uid: socket.uid,
                            points: socket.points,
                        });
                    }
                } else {
                    result = data;
                }

                for (var i in result) {

                    if (result[i].points < result[current].points) {
                        if (!value) {
                            position += count;
                        } else {
                            position += value;
                        }

                        value = 1;
                    } else {
                        if (value) {
                            value++;
                        }
                    }

                    ranking[i] = {
                        uid: result[i].uid,
                        points: result[i].points,
                        position: position
                    };

                    current = i;
                }

                socket.emit('ranking', {
                    ranking: data,
                    pages: moduleSocket.getPage(total, offset, limit)
                });
            });
        });
    };

    moduleSocket.getRequestRankingWithUser = function (socket, friends) {
            
        var request;

        if (friends) {
            request = {
                $and: [{
                    actif: 1,
                    uid: {
                        $in: friends
                    }
                }, {
                    uid: {
                        $ne: socket.uid
                    }
                }]
            };
        } else {
            request = {
                $and: [{
                    actif: 1
                }, {
                    uid: {
                        $ne: socket.uid
                    }
                }]
            };
        }

        return request;
    };

    moduleSocket.getRequestRankingWithoutUser = function (friends) {
            
        var request;

        if (friends) {
            request = {
                actif: 1,
                uid: {
                    $in: friends
                }
            };
        } else {
            request = {
                actif: 1
            };
        }

        return request;
    };

    moduleSocket.getPage = function (total, offset, limit) {
        var page = Math.ceil(offset / limit) + 1,
            last = Math.ceil(total / limit);

        if (last <= 1) {
            return;
        }

        return {
            page: page,
            prev: moduleSocket.getPagePrev(page, offset, limit),
            next: moduleSocket.getPageNext(page, last),
            last: last
        };
    };

    moduleSocket.getFreeTime = function (time) {
        return (3600 * 24) - (Math.round(new Date().getTime() / 1000) - time);
    };

    moduleSocket.getPageNext = function (page, last) {
        if (page != last) {
            return page + 1;
        }
        return false;
    };

    moduleSocket.getPagePrev = function (page, offset, limit) {
        if (offset >= limit) {
            return page - 1;
        }
        return false;
    };

    moduleSocket.init = function (socket, data) {

        var socketConnected = moduleSocket.getSocket(data.uid);

        if (socketConnected) {
            socketConnected.disconnect();
        }

        socket.uid = data.uid;
        socket.name = data.name;
        moduleSocket.connected[data.uid] = socket.id;

        users.count({ uid: data.uid }, function (err, count) {

            if (err) {
                moduleSocket.disconnectSocket(socket);
                return;
            }

            if (count == 0) {

                var user = new users({
                    uid: data.uid,
                    points: 1500,
                    tokens: 17,
                    trophy: 1,
                    parrainage: data.sponsorship,
                });

                user.save(function (err) {
                    if (err) {
                        moduleSocket.disconnectSocket(socket);
                        return;
                    }
                    moduleSocket.initUser(socket);
                });
            } else {
                moduleSocket.initUser(socket, data.sponsorship);
            }
        });
    };

    moduleSocket.initUser = function(socket, sponsorship) {

        if (!moduleSocket.checkSocketUid(socket)) {
            return;
        }

        var uid = socket.uid ? socket.uid : 0;

        users.findOne({
            uid: uid
        }, function (err, data) {

            if (err || !data) {
                return;
            }

            if (data.ban) {
                moduleSocket.disconnectSocket(socket);
                return;
            }

            moduleSocket.infosUser(socket, uid, sponsorship, data);
        });
    };

    moduleSocket.infosUser = function (socket, uid, sponsorship, data) {

        socket.moderateur = data.moderateur ? true : false;

        moduleSocket.checkTrophy(uid);

        if (!data.parrainage && sponsorship) {
            moduleSocket.updateUserSponsorship(uid, sponsorship);
        }

        var points = data.points;
        
        socket.points = points;

        moduleSocket.infosUserTokens(socket, uid, data);
    };

    moduleSocket.infosUserTokens = function (socket, uid, data) {

        freeTokens.findOne({
            uid: uid
        }, 'time', function (err, res) {
            
            if (err) {
                return;
            }

            var token = 0;

            if (!data.tokens && data.tokens != 0) {
                token += 17;
                moduleSocket.updateUserTokens(uid, token);
            } else {
                token += data.tokens;
            }

            var time = Math.round(new Date().getTime() / 1000),
                freeTime;

            if (!res || !res.time) {
                token += 3;
                freeTime = time;
                var freeToken = new freeTokens({
                    uid: uid
                });
                freeToken.time = time;
                freeToken.save();
                moduleSocket.updateUserTokens(uid, token);
            } else if (res.time < (time - (24 * 3600))) {
                freeTime = time;
                token += 3;
                 moduleSocket.updateTokens(uid, time);   
                moduleSocket.updateUserTokens(uid, token);
            } else {
                freeTime = res.time;
            }

            moduleSocket.infosUserBadges(socket, uid, token, freeTime);
        });
    };

    moduleSocket.infosUserBadges = function(socket, uid, token, freeTime) {

        badges.find({
            uid: uid
        }, function (err, data) {
            if (err) {
                return;
            }

            moduleSocket.infosUserRanking(socket, uid, token, freeTime, data);
        });

    };

    moduleSocket.infosUserRanking = function (socket, uid, token, freeTime, trophies) {
        users.count({
            actif: 1,
            points: {
                $gt: socket.points
            }
        }, function (err, count) {

            if (err) {
                return;
            }

            socket.ranking = count + 1;
            socket.join('home', function () {
                moduleSocket.connected();
            });

            socket.emit('infosUser', {
                moderateur: socket.moderateur,
                points: socket.points,
                ranking: socket.ranking,
                tokens: token,
                freeTime: moduleSocket.getFreeTime(freeTime),
                trophies: trophies
            });

            socket.emit('listGames', moduleGame.createdGame);
        });
    };

    moduleSocket.updateTokens = function (uid, time) {
        freeTokens.update({
            uid: uid
        }, {
            $set: {
                time: time
            }
        }, moduleUtils.fn);
    };

    moduleSocket.updateUserTokens = function (uid, token) {
        users.update({
            uid: uid
        }, {
            $set: {
                tokens: token
            }
        }, moduleUtils.fn);
    };

    moduleSocket.updateUserSponsorship = function (uid, sponsorship) {
        users.update({
            uid: uid
        }, {
            $set: {
                parrainage: sponsorship
            }
        }, moduleUtils.fn);
    };

    moduleSocket.checkTrophy = function (uid) {

        games.count({
            $or: [{
                blanc: uid
            }, {
                noir: uid
            }]
        }, function (err, count) {

            if (err || !count) {
                return;
            }

            if (count >= 1000) {
                moduleSocket.setTrophy(uid, 4);
                moduleSocket.setTrophy(uid, 3);
                moduleSocket.setTrophy(uid, 2);
                moduleSocket.setTrophy(uid, 1);
            } else if (count >= 500) {
                moduleSocket.setTrophy(uid, 3);
                moduleSocket.setTrophy(uid, 2);
                moduleSocket.setTrophy(uid, 1);
            } else if (count >= 100) {
                moduleSocket.setTrophy(uid, 2);
                moduleSocket.setTrophy(uid, 1);
            } else if (count >= 1) {
                moduleSocket.setTrophy(uid, 1);
            }
        });

        games.count({
            "$or": [{
                "$and": [{
                    "noir": uid,
                    "resultat": 2
                }]
            }, {
                "$and": [{
                    "blanc": uid,
                    "resultat": 1
                }]
            }]
        }, function (err, count) {

            if (err || !count) {
                return;
            }

            if (count >= 500) {
                moduleSocket.setTrophy(uid, 9);
                moduleSocket.setTrophy(uid, 8);
                moduleSocket.setTrophy(uid, 7);
                moduleSocket.setTrophy(uid, 6);
            } else if (count >= 250) {
                moduleSocket.setTrophy(uid, 8);
                moduleSocket.setTrophy(uid, 7);
                moduleSocket.setTrophy(uid, 6);
            } else if (count >= 50) {
                moduleSocket.setTrophy(uid, 7);
                moduleSocket.setTrophy(uid, 6);
            } else if (count >= 1) {
                moduleSocket.setTrophy(uid, 6);
            }
        });
    };

    moduleSocket.setTrophy = function (uid, trophy) {

        badges.count({
            uid: uid,
            badge: trophy
        }, function (err, count) {

            if (err || count) {
                return;
            }

            var badge = new badges({
                uid: uid
            });
            badge.badge = trophy;
            badge.save();

            var socketOpponent = moduleSocket.getSocket(uid);

            if (socketOpponent) {
                socketOpponent.emit('trophy', trophy);
            }
        });
    };

    var users = mongoose.models.users,
        games = mongoose.models.games,
        badges = mongoose.models.badges,
        freeTokens = mongoose.models.freeTokens,
        payments = mongoose.models.payments;

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

            moduleSocket.listGames();
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

                users.count(request, function (err, count) {

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

            users.findOne({
                uid: socket.uid
            }, 'tokens', function (err, data) {

                if (err || !data) {
                    return;
                }

                token = parseInt(data.tokens) + parseInt(item.tokens);

                new payments({
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
                    users.update({ uid: socket.uid }, { $set: { tokens: token } }, function (err) {
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
