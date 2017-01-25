'use strict';

var request = require('request'),
    db = require(dirname + '/server/modules/db'),
    moduleGame = require(dirname + '/server/modules/game');

module.exports = function (io) {

    function Module() {
        this.connected = {};
        this.userGames = {};
    }

    Module.prototype.facebookConnect = function (socket, data) {

        var self = this;

        request.get('https://graph.facebook.com/v2.8/' + data.id + '?access_token=' + data.accessToken + '&fields=id,name,picture', 
            function (error, response, body) {
                try {
                    body = JSON.parse(body);
                    self.create(socket, {
                        facebookId: body.id,
                        name: body.name,
                        avatar: body.picture.data.url
                    }, { facebookId: body.id });
                } catch (Error) {
                    socket.disconnect();
                }
            }
        );
    };

    Module.prototype.googleConnect = function (socket, data) {
        
        var self = this;

        request.get('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + data.accessToken, 
            function (error, response, body) {
                try {
                    body = JSON.parse(body);
                    self.create(socket, {
                        googleId: body.user_id,
                        name: data.name,
                        avatar: data.avatar
                    }, { googleId: body.user_id });
                } catch (Error) {
                    socket.disconnect();
                }
            }
        );
    };

    Module.prototype.create = function (socket, data, request) {
        
        if (socket.uid) {
            return;
        }

        var self = this;

        db.findOne('users', request)
        .then(function (response) {

            if (!response) {
                return db.save('users', Object.assign(data, {
                    points: 1500,
                    trophies: []
                }));
            }

            var saveData = {};

            if (data.name && response.name !== data.name) {
                saveData.name = data.name;
            }

            if (data.avatar && (!response || response.avatar !== data.avatar)) {
                saveData.avatar = data.avatar;
            }

            if (saveData) {
                db.update('users', { _id: response._id }, saveData);
                Object.assign(response, saveData);
            }

            return response;
        })
        .then(function (response) {

            var connected = self.getSocket(response.id);

            if (connected) {
                connected.disconnect(true);
            }

            socket.uid = response.id;
            socket.avatar = response.avatar;
            socket.name = response.name;
            socket.facebookId = response.facebookId;

            self.connected[response.id] = socket.id;
            
            return self.init(socket, response);
        })
        .then(function () {
            var gid = self.getUserGame(socket.uid);
            if (gid) {
                socket.join(moduleGame.getRoom(gid), function () {
                    socket.emit('startGame', gid);
                });
            }
            socket.emit('connected');
        });
    };

    Module.prototype.joinHome = function (socket) {
        var self = this;
        socket.join('home', function () {
            socket.emit('listGames', moduleGame.createdGame);
            socket.emit('listChallenges', socket.challenges);
            self.listChallengers();
        });
    };

    Module.prototype.refreshUser = function (socket) {
        
        var self = this;

        return db.findOne('users', { _id: db.ObjectId(socket.uid) })
        .then(function (response) {
            return self.init(socket, response);
        });
    };

    Module.prototype.init = function (socket, data) {

        if (data.unauthorized) {
            socket.emit('unauthorized');
            throw new Error('unauthorized');
        }

        var blackList = [];
        
        if (data.blackList instanceof Object) {
            var expires  = this.getBlackListExpires();
            for (var uid in data.blackList) {
                if (data.blackList[uid] >= expires) {
                    blackList.push(uid);
                }
            };
        }

        socket.points = data.points;
        socket.blackList = blackList;
        socket.trophies = data.trophies;

        var self = this;

        return db.count('users', { active: true, points: { $gt: data.points } })
        .then(function (response) {

            socket.ranking = response + 1;

            socket.emit('user', {
                uid: socket.uid,
                name: socket.name,
                avatar: socket.avatar,
                points: socket.points,
                ranking: socket.ranking,
                blackList: socket.blackList,
                trophies: data.trophies
            });
        });
    };

    Module.prototype.listGames = function (createdGame) {
        this.sendHome('listGames', createdGame);
    };

    Module.prototype.sendHome = function (name, data) {
        io.sockets.to('home').emit(name, data);  
    };

    Module.prototype.getUserGame = function (uid) {
        return this.userGames[uid];
    };

    Module.prototype.isBlackListed = function (data, uid) {
        return data.indexOf(uid) !== -1;
    };

    Module.prototype.checkStartGame = function (socket, uid) {
        return this.checkSocket(socket) && 
               !this.getUserGame(socket.uid) && 
               socket.uid !== uid;
    };

    Module.prototype.startGame = function (socket, socketOpponent, dataGame) {
        
        moduleGame.deleteCreatedGame(socket.uid);
        moduleGame.deleteCreatedGame(socketOpponent.uid);
        
        this.listGames(moduleGame.createdGame);
        
        socket.leave('home');
        socketOpponent.leave('home');
        
        this.listChallengers();
        
        this.deleteChallenges(socket);
        this.deleteChallenges(socketOpponent);

        var self = this, white, black;

        if (dataGame.color === 'white') {
            white = {
                uid: socketOpponent.uid,
                avatar: socketOpponent.avatar,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking
            };
            black = {
                uid: socket.uid,
                avatar: socket.avatar,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking
            };
        } else {
            white = {
                uid: socket.uid,
                avatar: socket.avatar,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking
            };
            black = {
                uid: socketOpponent.uid,
                avatar: socketOpponent.avatar,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking
            };
        }

        db.all([
            db.count('games', { $or: [{ white: white.uid }, { black: white.uid }] }),
            db.count('games', { $or: [{ white: black.uid }, { black: black.uid }] })
        ]).then(function (response) {

            white.countGame = response[0];
            black.countGame = response[1];

            var gid = moduleGame.start(white, black, dataGame.time),
                room = moduleGame.getRoom(gid);

            self.userGames[socket.uid] = gid;
            self.userGames[socketOpponent.uid] = gid;

            socket.join(room);
            socketOpponent.join(room);

            io.to(room).emit('startGame', gid);
        });
    };

    Module.prototype.getBlackListExpires = function () {
        var date = new Date();
        date.setDate(date.getDate() - 1);
        return date.getTime();
    };

    Module.prototype.getNewBlackList = function (blackList, lastGame, newGame, game, color) {

        if (!(blackList instanceof Object)) {
            blackList = {};
        } else {
            var expires  = this.getBlackListExpires();
            for (var uid in blackList) {
                if (expires > blackList[uid]) {
                    delete blackList[uid];
                }
            };
        }

        if (lastGame && lastGame === newGame) {
            blackList[color === 'white' ? game.black.uid : game.white.uid] = new Date().getTime();
            console.log('blackList', blackList);
        }

        return blackList;
    };

    Module.prototype.getNewSuccess = function (success, result, position) {

        if (!success) {
            success = 0;
        }

        if (result === 0) {
            success = 0;
        } else if (result === position) {
            if (success < 0) {
                success = 0;
            }
            success++;
        } else {
            if (success > 0) {
                success = 0;
            }
            success--;
        }

        return success;
    };

    Module.prototype.getNewPoints = function (p1, p2, result, position) {
        var coefficient = 0;
        if (result === 0) {
            coefficient = 0.5;
        } else if (result === position) {
            coefficient = 1;
        }
        return p1.points + moduleGame.getPoints(p1.points, p2.points, coefficient, p1.countGame)
    };

    Module.prototype.saveGame = function (game) {

        var self = this,
            white = game.white,
            black = game.black,
            result = game.result.value,
            hashGame = null,
            data;

        if (result !== 0 && (game.played.length < 4 || game.timestamp < game.timeTurn)) {
            hashGame = '';
            game.played.forEach(function (value) {
                hashGame += value.hash;
            });
            hashGame = JSON.stringify(hashGame).hash();
        }

        moduleGame.deleteGame(game.id);

        delete this.userGames[white.uid];
        delete this.userGames[black.uid];

        data = {
            white: {
                points: this.getNewPoints(white, black, result, 1),
                lastGame: hashGame
            },
            black: {
                points: this.getNewPoints(black, white, result, 2),
                lastGame: hashGame
            }
        };

        db.all([
            db.findOne('users', { _id: db.ObjectId(white.uid) }),
            db.findOne('users', { _id: db.ObjectId(black.uid) }),
            db.save('games', {
                result: result,
                white: white.uid,
                black: black.uid,
                date: new Date()
            })
        ]).then(function (response) {

            data.white.success = self.getNewSuccess(response[0].success, result, 1);
            data.black.success = self.getNewSuccess(response[1].success, result, 2);
            data.white.blackList = self.getNewBlackList(response[0].blackList, response[0].lastGame, hashGame, game, 'white');
            data.black.blackList = self.getNewBlackList(response[1].blackList, response[1].lastGame, hashGame, game, 'black');
            data.white.trophies = response[0].trophies;
            data.black.trophies = response[1].trophies;
            data.white.countGame = white.countGame + 1;
            data.black.countGame = black.countGame + 1;

            self.setTrophies(white.uid, data.white);
            self.setTrophies(black.uid, data.black);

            db.all([
                db.update('users', { _id: db.ObjectId(white.uid) }, {
                    points: data.white.points,
                    success: data.white.success,
                    lastGame: data.white.lastGame,
                    blackList: data.white.blackList,
                    active: true
                }),
                db.update('users', { _id: db.ObjectId(black.uid) }, {
                    points: data.black.points,
                    success: data.black.success,
                    lastGame: data.black.lastGame,
                    blackList: data.black.blackList,
                    active: true
                })
            ]);
        });
    };

    Module.prototype.setChallenges = function (socket, key, value) {
        if (!socket.challenges) {
            socket.challenges = {};
        }

        socket.challenges[key] = value;
    };

    Module.prototype.deleteChallenges = function (socket) {
        if (!this.checkSocket(socket) || !socket.challenges) {
            return;
        }

        for (var uid in socket.challenges) {
            this.deleteChallenge(this.getSocket(uid), socket.uid);
        }

        delete socket.challenges;
    };

    Module.prototype.deleteChallenge = function (socket, uid) {
        if (!socket || !socket.challenges || !socket.challenges[uid]) {
            return;
        }

        delete socket.challenges[uid];
        socket.emit('listChallenges', socket.challenges);
    };

    Module.prototype.getChallenge = function (socket, uid) {
        if (!socket.challenges || !socket.challenges[uid]) {
            return;
        }

        return socket.challenges[uid];
    };

    Module.prototype.getSocket = function (uid) {

        var id = this.connected[uid],
            socket = null;

        if (!id) {
            return socket;
        }

        for (var socketId in io.sockets.sockets) {
            if (id === socketId) {
                socket = io.sockets.connected[socketId];
            }
        };

        return socket;
    };

    Module.prototype.checkSocket = function (socket) {
        if (!socket.uid) {
            socket.disconnect();
            return false;
        }
        return true;
    };

    Module.prototype.listChallengers = function () {

        var challengers = [],
            room = io.sockets.adapter.rooms['home'];

        if (room && room.sockets) {
            for (var socketId in room.sockets) {
                var socket = io.sockets.connected[socketId];
                if (!socket || !socket.uid) {
                    continue;
                }
                challengers.push({
                    uid: socket.uid,
                    facebookId: socket.facebookId,
                    avatar: socket.avatar,
                    name: socket.name,
                    ranking: socket.ranking,
                    points: socket.points,
                    blackList: socket.blackList
                });
            };
        }

        io.sockets.to('home').emit('challengers', challengers);
    };

    Module.prototype.profile = function (socket, data) {
        db.findOne('users', { _id: db.ObjectId(data.uid) }, 'points')
        .then(function (response) {
            data.points = response.points;
            return db.all([
                db.count('users', {
                    active: true,
                    points: {
                        $gt: data.points
                    }
                }),
                db.count('games', {
                    $or: [{
                        white: data.uid
                    }, {
                        black: data.uid
                    }]
                }), 
                db.count('games', {
                    $or: [{
                        white: data.uid,
                        result: 1
                    }, {
                        black: data.uid,
                        result: 2
                    }]
                }),
                db.count('games', {
                    $or: [{
                        white: data.uid,
                        result: 0
                    }, {
                        black: data.uid,
                        result: 0
                    }]
                })
            ]);
        })
        .then(function (response) {
            data.ranking = response[0] + 1;
            data.games = response[1];
            data.win = response[2];
            data.draw = response[3];
            data.lose = data.games - (data.win + data.draw);
            socket.emit('profile', data);
        });
    };

    Module.prototype.ranking = function (socket, data) {

        var page = parseInt(data.page),
            limit = 10,
            friends = data.friends,
            user;

        if (page) {
            user = false;
            page = this.formatPage(page);
            this.initRanking(socket, page, limit, user, friends);
        } else {

            user = true;

            var self = this,
                points = socket.points;

            db.findOne('users', { _id: db.ObjectId(socket.uid) }, 'points')
            .then(function (response) {
                socket.points = response.points;
                return db.count('users', friends ? { active: true, facebookId: { $in: friends }, points: { $gt: response.points } } : { active: true, points: { $gt: response.points } });
            })
            .then(function (response) {
                page = self.formatPage(Math.ceil((response + 1) / limit));
                self.initRanking(socket, page, limit, user, friends);
            });
        }
    };

    Module.prototype.initRanking = function (socket, page, limit, user, friends) {

        var self = this,
            request,
            data,
            offset,
            total,
            position;

        if (user) {
            request = friends ? { $and: [{ active: true, facebookId: { $in: friends } }, { _id: { $ne: db.ObjectId(socket.uid) } }] } : { $and: [{ active: true }, { _id: { $ne: db.ObjectId(socket.uid) } }] };
        } else {
            request = friends ? { active: true, facebookId: { $in: friends } } : { active: true };
        }

        db.count('users', request)
        .then(function (response) {

            offset = (page * limit) - limit;

            if (response === 0) {
                socket.emit('ranking', {
                    ranking:[{
                        uid: socket.uid,
                        name: socket.name,
                        avatar: socket.avatar,
                        points: socket.points,
                        position: 1
                    }]
                });
                this.finally;
            }

            if (user) {
                response++;
            }

            total = response;

            return db.exec('users', request, { points: -1 }, offset, user ? limit - 1 : limit, { points: 1 });
        })
        .then(function (response) {

            if (typeof response[0] !== 'object' || typeof response[0].points !== 'number') {
                socket.emit('ranking', false);
                this.finally;
            }

            data = response;

            var requests,
                points = (user && socket.points > response[0].points) ? socket.points : response[0].points;

            if (friends) {
                requests = [
                    db.count('users', { active: true, facebookId: { $in: friends }, points: { $gt: points } }),
                    db.count('users', { active: true, facebookId: { $in: friends }, points: data[0].points }),
                ];
            } else {
                requests = [
                    db.count('users', { active: true, points: { $gt: points } }),
                    db.count('users', { active: true, points: data[0].points }),
                ];
            }

            return db.all(requests);
        })
        .then(function (response) {

            position = response[0] + 1;

            socket.emit('ranking', {
                ranking: self.getRanking(socket, data, position, response[1], user),
                pages: self.getPages(total, offset, limit)
            });
        });
    };

    Module.prototype.getRanking = function (socket, data, position, count, user) {
        
        var current = 0,
            result = [],
            ranking = {},
            value;

        if (user) {

            var saveUser = false;

            for (var i in data) {
                if (!saveUser && socket.points >= data[i].points) {
                    result.push({
                        id: socket.uid,
                        name: socket.name,
                        avatar: socket.avatar,
                        points: socket.points
                    });
                    saveUser = true;
                }
                result.push(data[i]);
            }

            if (!saveUser) {
                result.push({
                    id: socket.uid,
                    name: socket.name,
                    avatar: socket.avatar,
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
                uid: result[i].id,
                name: result[i].name,
                avatar: result[i].avatar,
                points: result[i].points,
                position: position
            };

            current = i;
        }

        return ranking;
    };

    Module.prototype.formatPage = function (page) {
        return page <= 0 ? 1 : page;
    };

    Module.prototype.getPages = function (total, offset, limit) {
        
        var page = Math.ceil(offset / limit) + 1,
            last = Math.ceil(total / limit);

        if (last <= 1) {
            return;
        }

        return {
            page: page,
            prev: offset >= limit ? page - 1 : false,
            next: page != last ? page + 1 : false,
            last: last
        };
    };

    Module.prototype.setTrophies = function (uid, data) {

        var self = this,
            date = new Date();

        date.setDate(date.getDate() - 1);

        db.all([
            db.count('games', {$or: [{ $and: [{ black: uid, result: 2 }] }, { $and: [{ white: uid, result: 1 }] }] }),
            db.count('games', { $and: [{ date: { $gt: date } }, { $or: [{white: uid}, {black: uid}] } ]})
        ]).then(function (response) {

            var trophies = [];

            if (data.countGame >= 5000) {
                trophies = trophies.concat([1, 2, 3, 4, 5]);
            } else if (data.countGame >= 1000) {
                trophies = trophies.concat([1, 2, 3, 4]);
            } else if (data.countGame >= 500) {
                trophies = trophies.concat([1, 2, 3]);
            } else if (data.countGame >= 100) {
                trophies = trophies.concat([1, 2]);
            } else if (data.countGame >= 1) {
                trophies = trophies.concat([1]);
            }

            if (response[0] >= 2000) {
                trophies = trophies.concat([6, 7, 8, 9, 10]);
            } else if (response[0] >= 500) {
                trophies = trophies.concat([6, 7, 8, 9]);
            } else if (response[0] >= 250) {
                trophies = trophies.concat([6, 7, 8]);
            } else if (response[0] >= 50) {
                trophies = trophies.concat([6, 7]);
            } else if (response[0] >= 1) {
                trophies = trophies.concat([6]);
            }

            if (response[1] >= 100) {
                trophies = trophies.concat([11, 12, 13, 14, 15]);
            } else if (response[1] >= 50) {
                trophies = trophies.concat([11, 12, 13, 14]);
            } else if (response[1] >= 25) {
                trophies = trophies.concat([11, 12, 13]);
            } else if (response[1] >= 10) {
                trophies = trophies.concat([11, 12]);
            } else if (response[1] >= 5) {
                trophies = trophies.concat([11]);
            }

            if (data.success >= 20) {
                trophies = trophies.concat([16, 17, 18, 19]);
            } else if (data.success >= 10) {
                trophies = trophies.concat([16, 17, 18]);
            } else if (data.success >= 5) {
                trophies = trophies.concat([16, 17]);
            } else if (data.success >= 3) {
                trophies = trophies.concat([16]);
            } else if (data.success <= -3) {
                trophies = trophies.concat([20]);
            }

            if (!trophies.length) {
                return;
            }

            var newTrophies = [];

            trophies.forEach(function (value) {
                if (data.trophies.indexOf(value) === -1) {
                    newTrophies.push(value);
                    data.trophies.push(value);
                }
            });

            if (!newTrophies.length) {
                return;
            }

            db.update('users', { _id: db.ObjectId(uid) }, { trophies: data.trophies })
            .then(function (response) {
                var socket = self.getSocket(uid);
                if (socket) {
                    socket.emit('trophies', {
                        newTrophies: newTrophies,
                        trophies: data.trophies
                    });
                }
            });
        });
    };

    return new Module();
};
