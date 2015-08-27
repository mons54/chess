module.exports = moduleSocket = function (io, mongoose, fbgraph) {

    moduleSocket.socketConnected = {};

    moduleSocket.userGames = {};

    moduleSocket.listGames = function (createdGame) {
        moduleSocket.sendHome('listGames', createdGame);
    };

    moduleSocket.sendHome = function (name, data) {
        io.sockets.to('home').emit(name, data);  
    };

    moduleSocket.getUserGame = function (uid) {
        return moduleSocket.userGames[uid];
    };

    moduleSocket.checkStartGame = function (uid, socket) {
        return moduleSocket.checkSocketUid(socket) && !moduleSocket.getUserGame(socket.uid) && socket.uid !== uid;
    };

    moduleSocket.startGame = function (uid, dataGame, socket, socketOpponent) {
        
        moduleGame.deleteCreatedGame(uid);
        moduleGame.deleteCreatedGame(socket.uid);
        
        moduleSocket.listGames(moduleGame.createdGame);
        
        socket.leave('home');
        socketOpponent.leave('home');
        
        moduleSocket.listChallengers();
        
        moduleSocket.deleteChallenges(socket);
        moduleSocket.deleteChallenges(socketOpponent);

        var white, black;

        if (dataGame.color === 'white') {
            white = {
                uid: socketOpponent.uid,
                name: socketOpponent.name
            };
            black = {
                uid: socket.uid,
                name: socket.name
            };
        } else {
            white = {
                uid: socket.uid,
                name: socket.name
            };
            black = {
                uid: socketOpponent.uid,
                name: socketOpponent.name
            };
        }


        var gid = moduleGame.start(white, black, dataGame.time),
            room = moduleGame.getRoom(gid);

        moduleSocket.userGames[socket.uid] = gid;
        moduleSocket.userGames[socketOpponent.uid] = gid;

        socket.join(room);
        socketOpponent.join(room);

        io.to(room).emit('startGame', gid);
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
        var id = moduleSocket.socketConnected[uid],
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

    moduleSocket.init = function (socket, data) {

        fbgraph.promise.post('/' + data.uid + '?access_token=' + data.accessToken)
        .then(function (response) {
            if (!response.success) {
                moduleSocket.disconnectSocket(socket);
                this.finally;
            }

            var socketConnected = moduleSocket.getSocket(data.uid);

            if (socketConnected) {
                socketConnected.disconnect();
            }

            socket.uid = data.uid;
            socket.name = data.name;
            moduleSocket.socketConnected[data.uid] = socket.id;

            return mongoose.promise.count('users', { uid: data.uid });
        })
        .then(function (response) {
            if (response === 0) {
                return mongoose.promise.save('users', {
                    uid: data.uid,
                    points: 1500,
                    tokens: 17,
                    trophy: 1,
                    parrainage: data.sponsorship,
                });
            }
            return true;
        })
        .then(function (response) {
            moduleSocket.initUser(socket, data.sponsorship);
        })
        .catch(function (error) {
            moduleSocket.disconnectSocket(socket);
        });
    };

    moduleSocket.initUser = function (socket, sponsorship) {

        if (!moduleSocket.checkSocketUid(socket)) {
            return;
        }

        mongoose.promise.findOne('users', { uid: socket.uid }, null)
        .then(function (response) {
            if (!response) {
                this.finally;
            }

            if (response.ban) {
                moduleSocket.disconnectSocket(socket);
                this.finally;
            }

            socket.moderateur = response.moderateur ? true : false;

            moduleSocket.checkTrophy(socket.uid);

            if (!response.parrainage && sponsorship) {
                moduleSocket.updateUserSponsorship(socket.uid, sponsorship);
            }

            socket.points = response.points;

            this.data = response;

            return mongoose.promise.findOne('freeTokens', { uid: socket.uid }, 'time');
        })
        .then(function (response) {
            this.token = 0;
            if (!this.data.tokens && this.data.tokens !== 0) {
                this.token += 17;
                moduleSocket.updateUserTokens(socket.uid, token);
            } else {
                this.token += data.tokens;
            }

            var time = Math.round(new Date().getTime() / 1000);

            if (!response || !response.time) {
                this.token += 3;
                this.freeTime = time;
                mongoose.promise.save('freeTokens', { uid: socket.uid, time: time });
                moduleSocket.updateUserTokens(socket.uid, this.token);
            } else if (response.time < (time - (24 * 3600))) {
                this.freeTime = time;
                this.token += 3;
                moduleSocket.updateTokens(socket.uid, this.freeTime);   
                moduleSocket.updateUserTokens(socket.uid, this.token);
            } else {
                this.freeTime = response.time;
            }

            return mongoose.promise.find('badges', { uid: socket.uid });
        })
        .then(function (response) {
            this.trophies = response;
            return mongoose.promise.count('users', { actif: 1, points: { $gt: socket.points } });
        })
        .then(function (response) {

            socket.ranking = response + 1;

            socket.emit('infosUser', {
                moderateur: socket.moderateur,
                points: socket.points,
                ranking: socket.ranking,
                tokens: this.token,
                freeTime: moduleSocket.getFreeTime(this.freeTime),
                trophies: this.trophies
            });

            var gid = moduleSocket.getUserGame(socket.uid);

            if (gid) {
                socket.join(moduleGame.getRoom(gid));
                socket.emit('startGame', gid);
            } else {
                socket.join('home', function () {
                    moduleSocket.connected();
                });
                socket.emit('listGames', moduleGame.createdGame);
            }

            socket.emit('ready');

        });
    };

    moduleSocket.ranking = function (socket, data) {
        var page = parseInt(data.page),
            limit = 8,
            friends = data.friends;

        if (page) {
            page = moduleSocket.formatPage(page);
            moduleSocket.initRanking(socket, friends, page, limit, false);
            return;
        }

        var points = socket.points,
            request = friends ? { actif: 1, uid: { $in: friends }, points: { $gt: points } } : { actif: 1, points: { $gt: points } };

        mongoose.promise.count('users', request)
        .then(function (count) {
            count++;
            var page = moduleSocket.formatPage(Math.ceil(count / limit));
            moduleSocket.initRanking(socket, friends, page, limit, true);
        });
    };

    moduleSocket.initRanking = function (socket, friends, page, limit, getUser) {
        var offset = (page * limit) - limit,
            request;

        if (getUser) {
            request = moduleSocket.getRequestRankingWithUser(socket.uid, friends);
        } else {
            request = moduleSocket.getRequestRankingWithoutUser(friends);
        }

        mongoose.promise.count('users', request)
        .then(function (count) {
            if (count === 0) {
                socket.emit('ranking', {
                    ranking:[{
                        uid: socket.uid,
                        points: socket.points,
                        position: 1
                    }]
                });
                this.finally;
            }

            if (getUser) {
                count++;
                limit = limit - 1;
            }

            this.total = count;

            return mongoose.promise.exec('users', request, { points: -1 }, offset, limit, { points: 1 });
        })
        .then(function (data) {
            if (typeof data[0] !== 'object' || typeof data[0].points !== 'number') {
                this.finally;
            }

            var points = (getUser && socket.points > data[0].points) ? socket.points : data[0].points,
                request = { actif: 1, points: { $gt: points } };

            if (friends) {
                request = { actif: 1, uid: { $in: friends }, points: { $gt: points } };
            }

            this.data = data;

            return mongoose.promise.count('users', request);
        })
        .then(function (count) {
            this.position = count + 1;
            var request = { actif: 1, points: this.data[0].points };
            if (friends) {
                request = { actif: 1, uid: { $in: friends }, points: this.data[0].points };
            }

            return mongoose.promise.count('users', request);
        })
        .then(function (count) {
            socket.emit('ranking', {
                ranking: moduleSocket.getRanking(this.data, this.position, count, getUser, socket.uid, socket.points),
                pages: moduleSocket.getPages(this.total, offset, limit)
            });
        });
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

    moduleSocket.updateTokens = function (uid, time) {
        mongoose.promise.update('freeTokens' , { uid: uid }, { time: time });
    };

    moduleSocket.updateUserTokens = function (uid, tokens) {
        mongoose.promise.update('users' , { uid: uid }, { tokens: tokens });
    };

    moduleSocket.updateUserSponsorship = function (uid, sponsorship) {
        mongoose.promise.update('users' , { uid: uid }, { parrainage: sponsorship });
    };

    moduleSocket.checkTrophy = function (uid) {
        mongoose.promise.count('games' , { $or: [{ blanc: uid }, { noir: uid }]})
        .then(function (response) {
            if (!response) {
                this.finally;
            }
            if (response >= 1000) {
                moduleSocket.setTrophy(uid, 4);
                moduleSocket.setTrophy(uid, 3);
                moduleSocket.setTrophy(uid, 2);
                moduleSocket.setTrophy(uid, 1);
            } else if (response >= 500) {
                moduleSocket.setTrophy(uid, 3);
                moduleSocket.setTrophy(uid, 2);
                moduleSocket.setTrophy(uid, 1);
            } else if (response >= 100) {
                moduleSocket.setTrophy(uid, 2);
                moduleSocket.setTrophy(uid, 1);
            } else if (response >= 1) {
                moduleSocket.setTrophy(uid, 1);
            }
        });

        mongoose.promise.count('games' , { $or: [{ $and: [{ noir: uid, resultat: 2 }] }, { $and: [{ blanc: uid, resultat: 1 }] }] })
        .then(function (response) {
            if (!response) {
                this.finally;
            }
            if (response >= 500) {
                moduleSocket.setTrophy(uid, 9);
                moduleSocket.setTrophy(uid, 8);
                moduleSocket.setTrophy(uid, 7);
                moduleSocket.setTrophy(uid, 6);
            } else if (response >= 250) {
                moduleSocket.setTrophy(uid, 8);
                moduleSocket.setTrophy(uid, 7);
                moduleSocket.setTrophy(uid, 6);
            } else if (response >= 50) {
                moduleSocket.setTrophy(uid, 7);
                moduleSocket.setTrophy(uid, 6);
            } else if (response >= 1) {
                moduleSocket.setTrophy(uid, 6);
            }
        });
    };

    moduleSocket.setTrophy = function (uid, trophy) {
        mongoose.promise.count('badges', { uid: uid, badge: trophy })
        .then(function (response) {
            if (!response) {
                this.finally;
            }
            mongoose.promise.save('badges', { uid: uid, badge: trophy });
            var socket = moduleSocket.getSocket(uid);
            if (socket) {
                socket.emit('trophy', trophy);
            }
        });
    };

    moduleSocket.payment = function (socket, request, item) {
        mongoose.promise.findOne('users', { uid: socket.uid }, 'tokens')
        .then(function (response) {
            if (!response) {
                this.finally;
            }

            this.tokens = parseInt(response.tokens) + parseInt(item.tokens);

            return mongoose.promise.save('payments', {
                id: request.payment_id,
                uid: socket.uid,
                item: item.item,
                type: 'charge',
                status: 'completed',
                time: request.issued_at,
            });
        })
        .then(function (response) {
            return mongoose.promise.update('users' , { uid: socket.uid }, { tokens: this.tokens });
        })
        .then(function (response) {
            moduleSocket.initUser(socket);
        });
    };

    return moduleSocket;
};
