module.exports = moduleSocket = function (io, mongoose) {

    moduleSocket.connected = {};

    moduleSocket.listGames = function (createdGame) {
        moduleSocket.sendHome('listGames', createdGame);
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

    moduleSocket.getRanking = function (data, position, count, getUser, uid, points) {
        var current = 0,
            result = [],
            ranking = {},
            value;

        if (getUser) {

            var saveUser = false;

            for (var i in data) {
                if (!saveUser && points >= data[i].points) {
                    result.push({
                        uid: uid,
                        points: points,
                    });
                    saveUser = true;
                }
                result.push(data[i]);
            }

            if (!saveUser) {
                result.push({
                    uid: uid,
                    points: points,
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

        return ranking;
    };

    moduleSocket.getRequestRankingWithUser = function (uid, friends) {
        return friends ? { $and: [{ actif: 1, uid: { $in: friends } }, { uid: { $ne: uid } }] } : { $and: [{ actif: 1 }, { uid: { $ne: uid } }] };
    };

    moduleSocket.getRequestRankingWithoutUser = function (friends) {  
        return friends ? { actif: 1, uid: { $in: friends } } : { actif: 1 };
    };

    moduleSocket.formatPage = function (page) {
        return page <= 0 ? 1 : page;
    };

    moduleSocket.getPages = function (total, offset, limit) {
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

        mongoose.models.users.count({ uid: data.uid }, function (err, count) {

            if (err) {
                moduleSocket.disconnectSocket(socket);
                return;
            }

            if (count == 0) {

                var user = new mongoose.models.users({
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

        mongoose.models.users.findOne({
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

        mongoose.models.freeTokens.findOne({
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
                var freeToken = new mongoose.models.freeTokens({
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

        mongoose.models.badges.find({
            uid: uid
        }, function (err, data) {
            if (err) {
                return;
            }

            moduleSocket.infosUserRanking(socket, uid, token, freeTime, data);
        });

    };

    moduleSocket.infosUserRanking = function (socket, uid, token, freeTime, trophies) {
        mongoose.models.users.count({
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
        mongoose.models.freeTokens.update({
            uid: uid
        }, {
            $set: {
                time: time
            }
        }, moduleUtils.fn);
    };

    moduleSocket.updateUserTokens = function (uid, token) {
        mongoose.models.users.update({
            uid: uid
        }, {
            $set: {
                tokens: token
            }
        }, moduleUtils.fn);
    };

    moduleSocket.updateUserSponsorship = function (uid, sponsorship) {
        mongoose.models.users.update({
            uid: uid
        }, {
            $set: {
                parrainage: sponsorship
            }
        }, moduleUtils.fn);
    };

    moduleSocket.checkTrophy = function (uid) {

        mongoose.models.games.count({
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

        mongoose.models.games.count({
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

        mongoose.models.badges.count({
            uid: uid,
            badge: trophy
        }, function (err, count) {

            if (err || count) {
                return;
            }

            var badge = new mongoose.models.badges({
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

    return moduleSocket;
};
