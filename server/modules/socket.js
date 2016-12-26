'use strict';

var fb = require(dirname + '/server/modules/fb'),
    db = require(dirname + '/server/modules/db'),
    moduleGame = require(dirname + '/server/modules/game');

module.exports = function (io) {

    function Module() {
        this.socketConnected = {};
        this.userGames = {};
    }

    Module.prototype.listGames = function (createdGame) {
        this.sendHome('listGames', createdGame);
    };

    Module.prototype.sendHome = function (name, data) {
        io.sockets.to('home').emit(name, data);  
    };

    Module.prototype.getUserGame = function (uid) {
        return this.userGames[uid];
    };

    Module.prototype.checkStartGame = function (socket, uid) {
        return this.checkSocketUid(socket) && !this.getUserGame(socket.uid) && socket.uid !== uid;
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

        var white, black;

        if (dataGame.color === 'white') {
            white = {
                uid: socketOpponent.uid,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking
            };
            black = {
                uid: socket.uid,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking
            };
        } else {
            white = {
                uid: socket.uid,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking
            };
            black = {
                uid: socketOpponent.uid,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking
            };
        }


        var gid = moduleGame.start(white, black, dataGame.time),
            room = moduleGame.getRoom(gid);

        this.userGames[socket.uid] = gid;
        this.userGames[socketOpponent.uid] = gid;

        socket.join(room);
        socketOpponent.join(room);

        io.to(room).emit('startGame', gid);
    };

    Module.prototype.getPointsGame = function (player1, player2) {

        var points = player1.points - player2.points;

        if (points > 400) {
            points = 400;
        } else if (points < -400) {
            points = -400;
        }

        points = points / 400;
        points = Math.pow(10, points);
        points = 1 + points;
        points = 1 / points;
        points = 1 - points;

        var k = 20;

        if (player1.points > 2400) {
            k = 10;
        } else if (player1.countGame <= 30) {
            k = 40;
        }

        return Math.round(k * (player1.coefGame - points));
    };

    Module.prototype.getBlackListGame = function (blackListGame, game, color) {

        if (!(blackListGame instanceof Object)) {
            blackListGame = {};
        } else {
            var maxTime = Math.round(new Date().getTime()) - (3600 * 1000);
            for (var uid in blackListGame) {
                if (maxTime > blackListGame[uid]) {
                    delete blackListGame[uid];
                }
            };
        }

        if (game.result.name === 'resign' && this.checkBlackListGame(game)) {
            blackListGame[color === 'white' ? game.black.uid : game.white.uid] = new Date().getTime();
        }

        return blackListGame;
    };

    Module.prototype.checkBlackListGame = function (game) {
        var maxTime = 10,
            time = game.time,
            timeWhite = game.white.time,
            timeBlack = game.black.time;
        
        return timeWhite + maxTime > time || timeBlack + maxTime > time;
    };

    Module.prototype.getDataPlayerGame = function (data, game, result, color) {
        
        var coefGame,
            position = color === 'white' ? 1 : 2,
            consWin  = data.consWin ? data.consWin : 0;

        if (result === 0) {
            coefGame = 0.5;
            consWin = 0;
        } else if (result === position) {
            coefGame = 1;
            if (consWin < 0) {
                consWin = 0;
            }
            consWin++;
        } else {
            coefGame = 0;
            if (consWin > 0) {
                consWin = 0;
            }
            consWin--;
        }

        return {
            coefGame: coefGame,
            consWin: consWin,
            blackListGame: this.getBlackListGame(data.blackListGame, game, color)
        };
    };

    Module.prototype.saveGame = function (game) {

        var self = this,
            uidWhite = game.white.uid,
            uidBlack = game.black.uid,
            result = game.result.winner,
            data;

        delete this.userGames[uidWhite];
        delete this.userGames[uidBlack];

        db.findOne('users', { uid: uidWhite }, null)
        .then(function (response) {
            
            var player = self.getDataPlayerGame(response, game, result, 'white');

            data = {
                white: {
                    points: response.points,
                    coefGame: player.coefGame,
                    consWin: player.consWin,
                    blackListGame: player.blackListGame
                }
            };

            return db.count('games', { $or: [{ white: uidWhite }, { black: uidWhite }] }, null);
        })
        .then(function (response) {

            data.white.countGame = response;

            return db.findOne('users', { uid: uidBlack }, null);
        })
        .then(function (response) {

            var player = self.getDataPlayerGame(response, game, result, 'black');
            
            data.black = {
                points: response.points,
                coefGame: player.coefGame,
                consWin: player.consWin,
                blackListGame: player.blackListGame
            };

            return db.count('games', { $or: [{ white: uidBlack }, { black: uidBlack }] }, null);
        })
        .then(function (response) {

            data.black.countGame = response;

            db.save('games', {
                result: result,
                white: uidWhite,
                black: uidBlack,
                date: new Date()
            });

            var pointsWhite = self.getPointsGame(data.white, data.black),
                pointsBlack = self.getPointsGame(data.black, data.white);

            data.white.points += self.getPointsGame(data.white, data.black);
            data.black.points += self.getPointsGame(data.black, data.white);

            self.updateUserGame(uidWhite, result, data.white);
            self.updateUserGame(uidBlack, result, data.black);
        });
    };

    Module.prototype.updateUserGame = function (uid, result, data) {
        var self = this;
        db.update('users', { uid: uid }, {
            points: data.points,
            consWin: data.consWin,
            blackListGame: data.blackListGame,
            active: true
        })
        .then(function (response) {
            data.countGame++;

            self.setTrophyGame(uid, data.countGame);

            if (result === 1) {
                self.setTrophyWin(uid);
            }

            self.setTrophyDay(uid);
            self.setTrophyConsWin(uid, data.consWin);
        });
    };

    Module.prototype.setChallenges = function (socket, key, value) {
        if (!socket.challenges) {
            socket.challenges = {};
        }

        socket.challenges[key] = value;
    };

    Module.prototype.deleteChallenges = function (socket) {
        if (!this.checkSocketUid(socket) || !socket.challenges) {
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
        socket.emit('challenges', socket.challenges);
    };

    Module.prototype.getChallenge = function (socket, uid) {
        if (!socket.challenges || !socket.challenges[uid]) {
            return;
        }

        return socket.challenges[uid];
    };

    Module.prototype.getSocket = function (uid) {
        var id = this.socketConnected[uid],
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

    Module.prototype.checkSocketUid = function (socket) {
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
                var user = io.sockets.connected[socketId];
                if (!user || !user.uid) {
                    return;
                }
                challengers.push({
                    uid: user.uid,
                    name: user.name,
                    ranking: user.ranking,
                    points: user.points
                });
            };
        }

        io.sockets.to('home').emit('challengers', challengers);
    };

    Module.prototype.connected = function () {
        io.sockets.emit('connected', io.sockets.sockets.length);
        this.listChallengers();
    };

    Module.prototype.init = function (socket, data) {

        var self = this;

        fb.post('/' + data.uid + '?access_token=' + data.accessToken)
        .then(function (response) {
            if (!response.success) {
                socket.disconnect();
                this.finally;
            }

            var socketConnected = self.getSocket(data.uid);

            if (socketConnected) {
                socketConnected.disconnect();
            }

            socket.uid = data.uid;
            socket.name = data.name;
            self.socketConnected[data.uid] = socket.id;

            return db.count('users', { uid: data.uid });
        })
        .then(function (response) {
            if (response === 0) {
                return db.save('users', {
                    uid: data.uid,
                    points: 1500
                });
            }
            return true;
        })
        .then(function (response) {
            self.initUser(socket);
        })
        .catch(function (error) {
            socket.disconnect();
        });
    };

    Module.prototype.initUser = function (socket) {

        if (!this.checkSocketUid(socket)) {
            return;
        }

        var self = this,
            trophies;

        db.findOne('users', { uid: socket.uid }, null)
        .then(function (response) {
            if (!response) {
                this.finally;
            }

            if (response.ban) {
                socket.disconnect();
                this.finally;
            }

            socket.moderateur = response.moderateur ? true : false;

            self.checkTrophies(socket.uid);

            socket.points = response.points;
            socket.blackListGame = response.blackListGame;

            return db.find('trophies', { uid: socket.uid });
        })
        .then(function (response) {
            trophies = response;
            return db.count('users', { active: 1, points: { $gt: socket.points } });
        })
        .then(function (response) {

            socket.ranking = response + 1;

            socket.emit('infosUser', {
                moderateur: socket.moderateur,
                points: socket.points,
                ranking: socket.ranking,
                trophies: trophies
            });

            var gid = self.getUserGame(socket.uid);

            if (gid) {
                socket.join(moduleGame.getRoom(gid));
                socket.emit('startGame', gid);
            } else {
                socket.join('home', function () {
                    self.connected();
                });
                socket.emit('listGames', moduleGame.createdGame);
            }

            socket.emit('ready');

        });
    };

    Module.prototype.profile = function (socket, data) {
        db.findOne('users', { uid: data.uid }, 'points')
        .then(function (response) {
            data.points = response.points;
            return db.all([
                db.count('users', {
                    active: 1,
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
            friends = data.friends;

        if (page) {
            page = this.formatPage(page);
            this.initRanking(socket, friends, page, limit, false);
            return;
        }

        var self = this,
            points = socket.points,
            request = friends ? { active: 1, uid: { $in: friends }, points: { $gt: points } } : { active: 1, points: { $gt: points } };

        db.count('users', request)
        .then(function (count) {
            count++;
            var page = self.formatPage(Math.ceil(count / limit));
            self.initRanking(socket, friends, page, limit, true);
        });
    };

    Module.prototype.initRanking = function (socket, friends, page, limit, getUser) {
        var self = this,
            offset = (page * limit) - limit,
            request,
            total,
            data,
            position;

        if (getUser) {
            request = this.getRequestRankingWithUser(socket.uid, friends);
        } else {
            request = this.getRequestRankingWithoutUser(friends);
        }

        db.count('users', request)
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
            }

            total = count;

            return db.exec('users', request, { points: -1 }, offset, getUser ? limit - 1 : limit, { points: 1 });
        })
        .then(function (response) {
            if (typeof response[0] !== 'object' || typeof response[0].points !== 'number') {
                socket.emit('ranking', false);
                this.finally;
            }

            var points = (getUser && socket.points > response[0].points) ? socket.points : response[0].points,
                request = { active: 1, points: { $gt: points } };

            if (friends) {
                request = { active: 1, uid: { $in: friends }, points: { $gt: points } };
            }

            data = response;

            return db.count('users', request);
        })
        .then(function (count) {
            position = count + 1;
            var request = { active: 1, points: data[0].points };
            if (friends) {
                request = { active: 1, uid: { $in: friends }, points: data[0].points };
            }

            return db.count('users', request);
        })
        .then(function (count) {
            socket.emit('ranking', {
                ranking: self.getRanking(data, position, count, getUser, socket.uid, socket.points),
                pages: self.getPages(total, offset, limit)
            });
        });
    };

    Module.prototype.getRanking = function (data, position, count, getUser, uid, points) {
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

    Module.prototype.getRequestRankingWithUser = function (uid, friends) {
        return friends ? { $and: [{ active: 1, uid: { $in: friends } }, { uid: { $ne: uid } }] } : { $and: [{ active: 1 }, { uid: { $ne: uid } }] };
    };

    Module.prototype.getRequestRankingWithoutUser = function (friends) {  
        return friends ? { active: 1, uid: { $in: friends } } : { active: 1 };
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
            prev: this.getPagePrev(page, offset, limit),
            next: this.getPageNext(page, last),
            last: last
        };
    };

    Module.prototype.getPageNext = function (page, last) {
        if (page != last) {
            return page + 1;
        }
        return false;
    };

    Module.prototype.getPagePrev = function (page, offset, limit) {
        if (offset >= limit) {
            return page - 1;
        }
        return false;
    };

    Module.prototype.checkTrophies = function (uid) {
        var self = this;
        db.count('games' , { $or: [{ white: uid }, { black: uid }]})
        .then(function (response) {
            if (!response) {
                this.finally;
            }
            if (response >= 1000) {
                self.setTrophy(uid, 4);
                self.setTrophy(uid, 3);
                self.setTrophy(uid, 2);
                self.setTrophy(uid, 1);
            } else if (response >= 500) {
                self.setTrophy(uid, 3);
                self.setTrophy(uid, 2);
                self.setTrophy(uid, 1);
            } else if (response >= 100) {
                self.setTrophy(uid, 2);
                self.setTrophy(uid, 1);
            } else if (response >= 1) {
                self.setTrophy(uid, 1);
            }
        });

        db.count('games' , { $or: [{ $and: [{ black: uid, result: 2 }] }, { $and: [{ white: uid, result: 1 }] }] })
        .then(function (response) {
            if (!response) {
                this.finally;
            }
            if (response >= 500) {
                self.setTrophy(uid, 9);
                self.setTrophy(uid, 8);
                self.setTrophy(uid, 7);
                self.setTrophy(uid, 6);
            } else if (response >= 250) {
                self.setTrophy(uid, 8);
                self.setTrophy(uid, 7);
                self.setTrophy(uid, 6);
            } else if (response >= 50) {
                self.setTrophy(uid, 7);
                self.setTrophy(uid, 6);
            } else if (response >= 1) {
                self.setTrophy(uid, 6);
            }
        });
    };

    Module.prototype.setTrophyGame = function (uid, games) {

        switch (games) {
            case 1:
                this.setTrophy(uid, 1);
                break;
            case 100:
                this.setTrophy(uid, 2);
                break;
            case 500:
                this.setTrophy(uid, 3);
                break;
            case 1000:
                this.setTrophy(uid, 4);
                break;
            case 5000:
                this.setTrophy(uid, 5);
                break;
        }
    };

    Module.prototype.setTrophyWin = function (uid) {

        var self = this;

        db.count('games', { 
            $or: [{ 
                $and: [{ black: uid, result: 2 }] 
            }, { 
                $and: [{ white: uid, result: 1 }]
            }] 
        })
        .then(function (response) {
            
            switch (response) {

                case 1:
                    self.setTrophy(uid, 6);
                    break;
                case 50:
                    self.setTrophy(uid, 7);
                    break;
                case 250:
                    self.setTrophy(uid, 8);
                    break;
                case 500:
                    self.setTrophy(uid, 9);
                    break;
                case 2000:
                    self.setTrophy(uid, 10);
                    break;
            }
        });
    };

    Module.prototype.setTrophyDay = function (uid) {

        var self = this,
            date = new Date(),
            game;

        date.setDate(date.getDate() - 1);

        db.count('games', { date: { $gt: date }, white: uid })
        .then(function (response) {
            game = response;
            return db.count('games', { date: { $gt: date }, black: uid })
        })
        .then(function (response) {
            game += response;
            if (game >= 100) {
                self.setTrophy(uid, 15);
            } else if (game >= 50) {
                self.setTrophy(uid, 14);
            } else if (game >= 25) {
                self.setTrophy(uid, 13);
            } else if (game >= 10) {
                self.setTrophy(uid, 12);
            } else if (game >= 5) {
                self.setTrophy(uid, 11);
            }
        });
    };

    Module.prototype.setTrophyConsWin = function (uid, consWin) {
        
        switch (consWin) {

            case 3:
                this.setTrophy(uid, 16);
                break;
            case 5:
                this.setTrophy(uid, 17);
                break;
            case 10:
                this.setTrophy(uid, 18);
                break;
            case 20:
                this.setTrophy(uid, 19);
                break;
            case -3:
                this.setTrophy(uid, 20);
                break;
        }
    };

    Module.prototype.setTrophy = function (uid, trophy) {
        var self = this;
        db.save('trophies', { uid: uid, trophy: trophy })
        .then(function (response) {
            var socket = self.getSocket(uid);
            if (socket) {
                socket.emit('trophy', response);
            }
        });
    };

    return new Module();
};
