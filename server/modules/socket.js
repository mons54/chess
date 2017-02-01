'use strict';

var request = require('request'),
    db = require(dirname + '/server/modules/db'),
    moduleGame = require(dirname + '/server/modules/game');

module.exports = function (io) {

    function Module() {
        this.connected = {};
        this.userGames = {};
        db.find('games', { finish: false }).then(function(response) {
            response.forEach(function (game) {
                moduleGame.setGame(game.id, game.data);
                this.userGames[game.white] = game.id;
                this.userGames[game.black] = game.id;
            }.bind(this));
        }.bind(this));
    }

    Module.prototype.facebookConnect = function (socket, data) {

        var self = this;

        request.get('https://graph.facebook.com/v2.8/' + data.id + '?access_token=' + data.accessToken + '&fields=id,name,picture', 
            function (error, response, body) {
                try {
                    
                    body = JSON.parse(body);

                    if (body.error && body.error.code === 190) {
                        socket.emit('refreshAccessToken');
                        return;
                    }

                    self.create(socket, {
                        facebookId: body.id,
                        name: body.name,
                        avatar: body.picture.data.url
                    }, { facebookId: body.id });
                } catch (Error) {
                    console.log(error, response);
                }
            }
        );
    };

    Module.prototype.googleConnect = function (socket, data) {
        
        var self = this;

        request.get('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + data.accessToken, 
            function (error, response, body) {
                try {

                    body = JSON.parse(body);

                    if (body.sub !== data.id) {
                        socket.emit('refreshAccessToken');
                        return;
                    }

                    self.create(socket, {
                        googleId: data.id,
                        name: data.name,
                        avatar: data.avatar
                    }, { googleId: data.id });
                } catch (Error) {
                    console.log(error, response);
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
                    blitz: 1500,
                    rapid: 1500,
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

        socket.blitz = {
            points: data.blitz
        };
        socket.rapid = {
            points: data.rapid
        };
        socket.blackList = blackList;
        socket.trophies = data.trophies;

        var self = this;

        return db.all([
            db.count('users', { active_blitz: true, blitz: { $gt: data.blitz } }),
            db.count('users', { active_rapid: true, rapid: { $gt: data.rapid } })
        ])
        .then(function (response) {

            socket.blitz.ranking = response[0] + 1;
            socket.rapid.ranking = response[1] + 1;

            socket.emit('user', {
                uid: socket.uid,
                name: socket.name,
                avatar: socket.avatar,
                blitz: socket.blitz,
                rapid: socket.rapid,
                blackList: socket.blackList,
                trophies: data.trophies
            });
        });
    };

    Module.prototype.listGames = function () {
        this.sendHome('listGames', moduleGame.createdGame);
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
        
        this.listGames();
        
        socket.leave('home');
        socketOpponent.leave('home');
        
        this.listChallengers();
        
        this.deleteChallenges(socket);
        this.deleteChallenges(socketOpponent);

        var self = this, white, black, type = dataGame.game.type;

        if (dataGame.color === 'white') {
            white = {
                uid: socketOpponent.uid,
                avatar: socketOpponent.avatar,
                name: socketOpponent.name,
                points: socketOpponent[type].points,
                ranking: socketOpponent[type].ranking
            };
            black = {
                uid: socket.uid,
                avatar: socket.avatar,
                name: socket.name,
                points: socket[type].points,
                ranking: socket[type].ranking
            };
        } else {
            white = {
                uid: socket.uid,
                avatar: socket.avatar,
                name: socket.name,
                points: socket[type].points,
                ranking: socket[type].ranking
            };
            black = {
                uid: socketOpponent.uid,
                avatar: socketOpponent.avatar,
                name: socketOpponent.name,
                points: socketOpponent[type].points,
                ranking: socketOpponent[type].ranking
            };
        }

        var game, req = {};

        db.all([
            db.count('games', { $and: [{ type: type }, { $or: [{ white: white.uid }, { black: white.uid }] }] }),
            db.count('games', { $and: [{ type: type }, { $or: [{ white: black.uid }, { black: black.uid }] }] })
        ]).
        then(function (response) {

            white.countGame = response[0];
            black.countGame = response[1];

            game = moduleGame.start(white, black, dataGame.game);

            return db.save('games', {
                type: game.type,
                white: white.uid,
                black: black.uid,
                finish: false,
                data: game
            })
        }).
        then(function (response) {

            var room = moduleGame.getRoom(response.id);

            moduleGame.setGame(response.id, game);

            self.userGames[socket.uid] = response.id;
            self.userGames[socketOpponent.uid] = response.id;

            socket.join(room);
            socketOpponent.join(room);

            io.to(room).emit('startGame', response.id);
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
        db.update('games', { _id: db.ObjectId(game.id) }, {
            data: game
        });
    };

    Module.prototype.finishGame = function (game) {

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
            db.update('games', { _id: db.ObjectId(game.id) }, {
                finish: true,
                result: result,
                data: game
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

            var whiteData = {
                success: data.white.success,
                lastGame: data.white.lastGame,
                blackList: data.white.blackList
            };

            whiteData[game.type] = data.white.points;
            whiteData['active_' + game.type] = true;

            var blackData = {
                success: data.black.success,
                lastGame: data.black.lastGame,
                blackList: data.black.blackList
            };

            blackData[game.type] = data.black.points;
            blackData['active_' + game.type] = true;

            db.all([
                db.update('users', { _id: db.ObjectId(white.uid) }, whiteData),
                db.update('users', { _id: db.ObjectId(black.uid) }, blackData)
            ]);
        });
    };

    Module.prototype.getFinishGame = function (socket, gid) {
        db.findOne('games', { _id: db.ObjectId(gid) }).then(function (response) {
            if (!response) {
                socket.emit('game', false);
            }
            socket.emit('game', response.data);
        });
    };

    Module.prototype.setChallenge = function (socket, key, value) {
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
                    blitz: socket.blitz,
                    rapid: socket.rapid,
                    blackList: socket.blackList
                });
            };
        }

        io.sockets.to('home').emit('challengers', challengers);
    };

    Module.prototype.profile = function (socket, data) {
        db.findOne('users', { _id: db.ObjectId(data.uid) }, 'blitz rapid')
        .then(function (response) {
            data.blitz = {
                points: response.blitz
            };
            data.rapid = {
                points: response.rapid
            };
            return db.all([
                db.count('users', {
                    active_blitz: true,
                    blitz: {
                        $gt: data.blitz.points
                    }
                }),
                db.count('games', {
                    $and: [{
                        type: 'blitz'
                    },
                    {
                        $or: [{
                            white: data.uid
                        }, {
                            black: data.uid
                        }]
                    }]
                }),
                db.count('games', {
                    $and: [{
                        type: 'blitz'
                    },
                    {
                        $or: [{
                            white: data.uid,
                            result: 1
                        }, {
                            black: data.uid,
                            result: 2
                        }]
                    }]
                }),
                db.count('games', {
                    $and: [{
                        type: 'blitz'
                    },
                    {
                        $or: [{
                            white: data.uid,
                            result: 0
                        }, {
                            black: data.uid,
                            result: 0
                        }]
                    }]
                }),
                db.count('users', {
                    active_rapid: true,
                    rapid: {
                        $gt: data.rapid.points
                    }
                }),
                db.count('games', {
                    $and: [{
                        type: 'rapid'
                    },
                    {
                        $or: [{
                            white: data.uid
                        }, {
                            black: data.uid
                        }]
                    }]
                }),
                db.count('games', {
                    $and: [{
                        type: 'rapid'
                    },
                    {
                        $or: [{
                            white: data.uid,
                            result: 1
                        }, {
                            black: data.uid,
                            result: 2
                        }]
                    }]
                }),
                db.count('games', {
                    $and: [{
                        type: 'rapid'
                    },
                    {
                        $or: [{
                            white: data.uid,
                            result: 0
                        }, {
                            black: data.uid,
                            result: 0
                        }]
                    }]
                })
            ]);
        })
        .then(function (response) {
            data.blitz.ranking = response[0] + 1;
            data.blitz.games = response[1];
            data.blitz.wins = response[2];
            data.blitz.draws = response[3];
            data.blitz.losses = data.blitz.games - (data.blitz.wins + data.blitz.draws);

            data.rapid.ranking = response[4] + 1;
            data.rapid.games = response[5];
            data.rapid.wins = response[6];
            data.rapid.draws = response[7];
            data.rapid.losses = data.rapid.games - (data.rapid.wins + data.rapid.draws);

            socket.emit('profile', data);
        });
    };

    Module.prototype.ranking = function (socket, data, limit, pages) {

        if (moduleGame.types.indexOf(data.type) === -1) {
            return;
        }

        var page = parseInt(data.page),
            limit = limit,
            friends = data.friends,
            user;

        if (page) {
            user = false;
            page = this.formatPage(page);
            this.initRanking(socket, page, limit, user, data.type, pages);
        } else {

            user = true;

            var self = this;

            db.findOne('users', { _id: db.ObjectId(socket.uid) }, data.type)
            .then(function (response) {
                var req = {};
                req[data.type] = { $gt: response[data.type] };
                req['active_' + data.type] = true;
                return db.count('users', req);
            })
            .then(function (response) {
                page = self.formatPage(Math.ceil((response + 1) / limit));
                self.initRanking(socket, page, limit, user, data.type, pages);
            });
        }
    };

    Module.prototype.initRanking = function (socket, page, limit, user, type, pages) {

        var self = this,
            active = {},
            request,
            data,
            offset,
            total,
            position;

        active['active_' + type] = true;

        if (user) {
            request = { $and: [active, { _id: { $ne: db.ObjectId(socket.uid) } }] };
        } else {
            request = active;
        }

        db.count('users', request)
        .then(function (response) {

            offset = (page * limit) - limit;

            if (response === 0) {
                var row = {
                    uid: socket.uid,
                    name: socket.name,
                    avatar: socket.avatar,
                    position: 1
                };
                row[type] = socket[type].points;
                socket.emit('ranking', {
                    ranking:[row]
                });
                this.finally;
            }

            if (user) {
                response++;
            }

            total = response;

            var sort = {},
                hint = {};

            sort[type] = -1;
            hint[type] = 1;

            return db.exec('users', request, sort, offset, user ? limit - 1 : limit, hint);
        })
        .then(function (response) {

            if (typeof response[0] !== 'object' || typeof response[0][type] !== 'number') {
                socket.emit('ranking', false);
                this.finally;
            }

            data = response;

            var points = (user && socket[type].points > response[0][type]) ? socket[type].points : response[0][type],
                req1 = {},
                req2 = {};

            req1[type] = { $gt: points };
            req1['active_' + type] = true;

            req2[type] = data[0][type];
            req2['active_' + type] = true;

            return db.all([
                db.count('users', req1),
                db.count('users', req2)
            ]);
        })
        .then(function (response) {

            position = response[0] + 1;

            var result = {
                ranking: self.getRanking(socket, data, position, response[1], user, type)
            };

            if (pages) {
                result.pages = self.getPages(total, offset, limit);
            }

            socket.emit('ranking', result);
        });
    };

    Module.prototype.getRanking = function (socket, data, position, count, user, type) {
        
        var current = 0,
            result = [],
            ranking = {},
            value;

        if (user) {

            var saveUser = false;

            for (var i in data) {
                if (!saveUser && socket[type].points >= data[i][type]) {
                    var row = {
                        id: socket.uid,
                        name: socket.name,
                        avatar: socket.avatar
                    };
                    row[type] = socket[type].points;
                    result.push(row);
                    saveUser = true;
                }
                result.push(data[i]);
            }

            if (!saveUser) {
                var row = {
                    id: socket.uid,
                    name: socket.name,
                    avatar: socket.avatar
                };
                row[type] = socket[type].points;
                result.push(row);
            }
        } else {
            result = data;
        }

        for (var i in result) {

            if (result[i][type] < result[current][type]) {
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
                points: result[i][type],
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

            var trophies = [],
                wins = response[0],
                gamesDay = response[1],
                success = data.success,
                points = data.points;

            if (data.countGame >= 5000) {
                trophies = trophies.concat([1, 2, 3, 4, 5]);
            } else if (data.countGame >= 2000) {
                trophies = trophies.concat([1, 2, 3, 4]);
            } else if (data.countGame >= 500) {
                trophies = trophies.concat([1, 2, 3]);
            } else if (data.countGame >= 100) {
                trophies = trophies.concat([1, 2]);
            } else if (data.countGame >= 1) {
                trophies = trophies.concat([1]);
            }

            if (wins >= 2500) {
                trophies = trophies.concat([6, 7, 8, 9, 10]);
            } else if (wins >= 1000) {
                trophies = trophies.concat([6, 7, 8, 9]);
            } else if (wins >= 250) {
                trophies = trophies.concat([6, 7, 8]);
            } else if (wins >= 50) {
                trophies = trophies.concat([6, 7]);
            } else if (wins >= 1) {
                trophies = trophies.concat([6]);
            }

            if (gamesDay >= 100) {
                trophies = trophies.concat([11, 12, 13, 14, 15]);
            } else if (gamesDay >= 50) {
                trophies = trophies.concat([11, 12, 13, 14]);
            } else if (gamesDay >= 25) {
                trophies = trophies.concat([11, 12, 13]);
            } else if (gamesDay >= 10) {
                trophies = trophies.concat([11, 12]);
            } else if (gamesDay >= 5) {
                trophies = trophies.concat([11]);
            }

            if (success >= 20) {
                trophies = trophies.concat([16, 17, 18, 19, 20]);
            } else if (success >= 15) {
                trophies = trophies.concat([16, 17, 18, 19]);
            } else if (success >= 10) {
                trophies = trophies.concat([16, 17, 18]);
            } else if (success >= 5) {
                trophies = trophies.concat([16, 17]);
            } else if (success >= 2) {
                trophies = trophies.concat([16]);
            }

            if (points >= 2800) {
                trophies = trophies.concat([21, 22, 23, 24, 25]);
            } else if (points >= 2400) {
                trophies = trophies.concat([21, 22, 23, 24]);
            } else if (points >= 2000) {
                trophies = trophies.concat([21, 22, 23]);
            } else if (points >= 1800) {
                trophies = trophies.concat([21, 22]);
            } else if (points >= 1600) {
                trophies = trophies.concat([21]);
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
