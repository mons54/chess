module.exports = Socket = function (app, io, mongoose, fbgraph, crypto) {

    Socket.game = require(dirname + '/server/modules/game')();  

    Socket.connected = {};

    var users = mongoose.models.users,
        games = mongoose.models.games,
        badges = mongoose.models.badges,
        freeTokens = mongoose.models.freeTokens,
        payments = mongoose.models.payments;

    io.on('connection', function (socket) {

        socket.on('init', function (data) {

            if (!data.uid || !data.accessToken) {
                disconnectSocket();
                return;
            }

            fbgraph.post('/' + data.uid + '?access_token=' + data.accessToken, function(err, res) {
                if (err || !res.success) {
                    disconnectSocket();
                    return;
                }
                init(data, err, res);
            });
        });

        socket.on('initUser', function () {
            initUser();
        });

        socket.on('createGame', function (data) {

            if (!data || !checkSocketUid() || !Socket.game.create(socket, data)) {
                return;
            }

            listGames();
        });

        socket.on('removeGame', function () {
            if (!checkSocketUid()) {
                return;
            }
            
            removeGame(socket.uid);
        });

        socket.on('challenge', function (data) {

            var socketOpponent = getSocket(data.uid),
                color = data.color,
                time = Socket.game.getTime(data.time);

            if (!checkSocketUid() || !socketOpponent || !Socket.game.checkColor(color) || !Socket.game.checkColor(color)) {
                return;
            }

            initChallenges(socketOpponent);

            socketOpponent.challenges[socket.uid] = {
                create: false,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking,
                color: color,
                time: time
            };

            initChallenges(socket);

            socket.challenges[data.uid] = {
                create: true,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking,
                color: color,
                time: time
            };

            socketOpponent.emit('challenges', socketOpponent.challenges);
            socket.emit('challenges', socket.challenges);
        });

        socket.on('removeChallenge', function (uid) {
            if (checkSocketUid()) {
                removeChallenge(getSocket(uid), socket.uid);
            }
            removeChallenge(socket, uid);
        });

        socket.on('newGame', function (data) {
            var game = Socket.game.start(data.white, data.black, data.time);

            socket.gid = game.id;

            socket.emit('game', game);
        });

        socket.on('move', function (data) {

            if (!socket.gid) {
                return;
            }

            var game = Socket.game.move(socket.gid, data.start, data.end, null);
            
            socket.emit('game', game);
        });

        socket.on('leaveHome', function () {

            if (!checkSocketUid()) {
                return;
            }

            socket.leave('home');
            listChallengers();

            removeGame(socket.uid);

            removeChallenges(socket);
        });

        socket.on('ranking', function (data) {
            if (!checkSocketUid()) {
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
                initRanking(friends, page, limit, false);
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

                    initRanking(friends, page, limit, true);
                });
            }
        });

        socket.on('disconnect', function () {

            if (checkSocketUid()) {
                delete Socket.connected[socket.uid];
                removeGame(socket.uid);
            }

            removeChallenges(socket);
            
        });

        function removeGame(uid) {

            if (!Socket.game.createdGame[uid]) {
                return;
            }

            delete Socket.game.createdGame[uid];
            listGames();
        }

        function listGames() {
            sendHome('listGames', Socket.game.createdGame);
        }

        function initChallenges(socket) {
            if (!socket.challenges) {
                socket.challenges = {};
            }
        }

        function removeChallenges(socket) {

            if (!checkSocketUid() || !socket.challenges) {
                return;
            }

            for (var uid in socket.challenges) {
                removeChallenge(getSocket(uid), socket.uid);
            }

            delete socket.challenges;
        }

        function removeChallenge(socket, uid) {

            if (!socket || !socket.challenges || !socket.challenges[uid]) {
                return;
            }

            delete socket.challenges[uid];
            socket.emit('challenges', socket.challenges);
        }

        function initRanking(friends, page, limit, getUser) {

            var offset = (page * limit) - limit,
                request;

            if (getUser) {
                request = getRequestRankingWithUser(friends);
            } else {
                request = getRequestRankingWithoutUser(friends);
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

                    emitRanking(data);

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

                    getRanking(data, count, friends, offset, limit, getUser);
                });
            });
        }

        function getRanking(data, total, friends, offset, limit, getUser) {
        
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

                    emitRanking(ranking, getPage(total, offset, limit));
                });
            });
        }

        function getRequestRankingWithUser(friends) {
            
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
        }

        function getRequestRankingWithoutUser(friends) {
            
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
        }

        function emitRanking(data, pages) {
            socket.emit('ranking', {
                ranking: data,
                pages: pages
            });
        }

        function getPage(total, offset, limit) {
            var page = Math.ceil(offset / limit) + 1,
                last = Math.ceil(total / limit);

            if (last <= 1) {
                return;
            }

            return {
                page: page,
                prev: getPagePrev(page, offset, limit),
                next: getPageNext(page, last),
                last: last
            };
        }

        function getPageNext(page, last) {
            if (page != last) {
                return page + 1;
            }
            return false;
        }

        function getPagePrev(page, offset, limit) {
            if (offset >= limit) {
                return page - 1;
            }
            return false;
        }

        function init(data) {

            var socketConnected = getSocket(data.uid);

            if (socketConnected) {
                socketConnected.disconnect();
            }

            socket.uid = data.uid;
            socket.name = data.name;
            Socket.connected[data.uid] = socket.id;

            users.count({
                uid: data.uid
            }, function checkUser(err, count) {

                if (err) {
                    disconnectSocket();
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

                    user.save(saveUser);
                } else {
                    initUser(data.sponsorship);
                }
            });
        }

        function saveUser(err) {

            if (err) {
                disconnectSocket();
                return;
            }

            initUser();
        }

        function initUser(sponsorship) {

            if (!checkSocketUid()) {
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
                    disconnectSocket();
                    return;
                }

                infosUser(uid, sponsorship, data);
            });
        }

        function infosUser(uid, sponsorship, data) {

            socket.moderateur = data.moderateur ? true : false;

            checkTrophy(uid);

            if (!data.parrainage && sponsorship) {
                updateUserSponsorship(uid, sponsorship);
            }

            var points = data.points;
            
            socket.points = points;

            infosUserTokens(uid, data);
        }

        function infosUserTokens(uid, data) {

            freeTokens.findOne({
                uid: uid
            }, 'time', function (err, res) {
                
                if (err) {
                    return;
                }

                var token = 0;

                if (!data.tokens && data.tokens != 0) {
                    token += 17;
                    updateUserTokens(uid, token);
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
                    updateUserTokens(uid, token);
                } else if (res.time < (time - (24 * 3600))) {
                    freeTime = time;
                    token += 3;
                    updateTokens(uid, time);   
                    updateUserTokens(uid, token);
                } else {
                    freeTime = res.time;
                }

                infosUserBadges(uid, token, freeTime);
            });
        }

        function infosUserBadges(uid, token, freeTime) {

            badges.find({
                uid: uid
            }, function (err, data) {
                if (err) {
                    return;
                }

                infosUserRanking(uid, token, freeTime, data);
            });

        }

        function infosUserRanking(uid, token, freeTime, trophy) {
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
                    connected();
                });

                socket.emit('infosUser', {
                    moderateur: socket.moderateur,
                    points: socket.points,
                    ranking: socket.ranking,
                    tokens: token,
                    freeTime: getFreeTime(freeTime),
                    trophy: trophy
                });

                socket.emit('listGames', Socket.game.createdGame);
            });
        }

        function connected() {
            io.sockets.emit('connected', io.sockets.sockets.length);
            listChallengers();
        }

        function listChallengers() {

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
        }

        function updateTokens(uid, time) {
            freeTokens.update({
                uid: uid
            }, {
                $set: {
                    time: time
                }
            }, fn);
        }

        function updateUserTokens(uid, token) {
            users.update({
                uid: uid
            }, {
                $set: {
                    tokens: token
                }
            }, fn);
        }

        function updateUserSponsorship(uid, sponsorship) {
            users.update({
                uid: uid
            }, {
                $set: {
                    parrainage: sponsorship
                }
            }, fn);
        }

        function checkTrophy(uid) {

            games.count({
                $or: [{
                    blanc: uid
                }, {
                    noir: uid
                }]
            }, function (err, count) {

                if (err || !count) return;

                if (count >= 1000) {

                    setTrophy(uid, 4);
                    setTrophy(uid, 3);
                    setTrophy(uid, 2);
                    setTrophy(uid, 1);

                } else if (count >= 500) {

                    setTrophy(uid, 3);
                    setTrophy(uid, 2);
                    setTrophy(uid, 1);

                } else if (count >= 100) {

                    setTrophy(uid, 2);
                    setTrophy(uid, 1);

                } else if (count >= 1) {

                    setTrophy(uid, 1);

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

                if (err || !count) return;

                if (count >= 500) {

                    setTrophy(uid, 9);
                    setTrophy(uid, 8);
                    setTrophy(uid, 7);
                    setTrophy(uid, 6);

                } else if (count >= 250) {

                    setTrophy(uid, 8);
                    setTrophy(uid, 7);
                    setTrophy(uid, 6);
                } else if (count >= 50) {

                    setTrophy(uid, 7);
                    setTrophy(uid, 6);
                } else if (count >= 1) {

                    setTrophy(uid, 6);
                }

            });
        }

        function setTrophy(uid, trophy) {

            badges.count({
                uid: uid,
                badge: trophy
            }, function (err, count) {

                if (err || !count) {
                    return;
                }

                var badge = new badges({
                    uid: uid
                });
                badge.badge = trophy;
                badge.save();

                var socketOpponent = getSocket(uid);

                if (socketOpponent) {
                    socketOpponent.emit('trophy', trophy);
                }
            });
        }

        function getFreeTime (time) {
            return (3600 * 24) - (Math.round(new Date().getTime() / 1000) - time);
        }

        function checkSocketUid() {
            if (!socket.uid) {
                disconnectSocket();
                return false;
            }
            return true;
        }

        function disconnectSocket() {
            socket.disconnect();
        }

        function getSocket(uid) {
            var id = Socket.connected[uid];
            if (!id) {
                return null;
            }
            var socket = null;
            io.sockets.sockets.forEach(function (value) {
                if (id == value.id) {
                    socket = value;
                }
            });
            return socket;
        }

        function sendHome(name, data) {
            io.sockets.to('home').emit(name, data);
        }

        function fn() { };
    });
};
