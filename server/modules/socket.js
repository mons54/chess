'use strict';

var request = require('request'),
    db = require(dirname + '/server/modules/db'),
    moduleGame = require(dirname + '/server/modules/game'),
    utils = require(dirname + '/public/utils');

module.exports = function (io) {

    function Module() {
        this.connected = {};
        this.userGames = {};
        this.timeout = {};
        db.find('games', { result: { $exists: false } }).then(function(response) {
            response.forEach(function (game) {
                moduleGame.setTimeTurn(game.data);
                moduleGame.setGame(game.id, game.data);
                this.userGames[game.white] = game.id;
                this.userGames[game.black] = game.id;
                this.setTimeoutGame(game.data);
            }.bind(this));
        }.bind(this));
    }

    Module.prototype.facebookConnect = function (socket, data) {

        request.get('https://graph.facebook.com/v2.8/' + data.id + '?access_token=' + data.accessToken + '&fields=id,name,picture,locale', 
            function (error, response, body) {
                try {
                    
                    body = JSON.parse(body);

                    if (body.error && body.error.code === 190) {
                        socket.emit('refreshAccessToken');
                        return;
                    }

                    if (!body.locale) {
                        body.locale = 'en';
                    }

                    this.create(socket, {
                        facebookId: body.id,
                        name: body.name,
                        avatar: body.picture.data.url,
                        lang: body.locale.substr(0, 2)
                    }, { facebookId: body.id });

                } catch (Error) {
                    console.log(body);
                }
            }.bind(this)
        );
    };

    Module.prototype.googleConnect = function (socket, data) {

        request.get('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + data.accessToken, 
            function (error, response, body) {
                try {

                    body = JSON.parse(body);

                    if (body.sub !== data.id) {
                        socket.emit('refreshAccessToken');
                        return;
                    }

                    this.create(socket, {
                        googleId: data.id,
                        name: data.name,
                        avatar: data.avatar,
                        lang: data.lang.substr(0, 2)
                    }, { googleId: data.id });

                } catch (Error) {
                    console.log(body);
                }
            }.bind(this)
        );
    };

    Module.prototype.create = function (socket, data, request) {
        
        if (socket.uid) {
            return;
        }

        db.findOne('users', request)
        .then(function (response) {

            if (!response) {
                return db.save('users', Object.assign(data, {
                    blitz: 1500,
                    rapid: 1500
                }));
            }

            var saveData = {};

            if (data.name && data.name !== response.name) {
                saveData.name = data.name;
            }

            if (!response.edited && 
                (data.avatar && data.avatar !== response.avatar)) {
                saveData.avatar = data.avatar;
            }

            if (!response.edited && 
                (data.lang && (!response.lang || data.lang !== response.lang))) {
                saveData.lang = data.lang.substr(0, 2);
            }

            if (Object.keys(saveData).length) {
                db.update('users', { _id: response._id }, saveData);
                Object.assign(response, saveData);
            }

            return response;
        })
        .then(function (response) {

            var connected = this.getSocket(response.id);

            if (connected) {
                connected.disconnect(true);
            }

            socket.uid = response.id;
            socket.avatar = response.avatar;
            socket.name = response.name;
            socket.facebookId = response.facebookId;
            socket.favorites = response.favorites;
            socket.challenges = [];

            this.connected[response.id] = socket.id;

            if (!connected) {
                io.to('home').emit('countConnected', Object.keys(this.connected).length);
            }
            
            return this.init(socket, response);
        }.bind(this))
        .then(function (response) {

            if (!response) {
                return;
            }
            
            var gid = this.getUserGame(response.id);
            if (gid) {
                socket.join(moduleGame.getRoom(gid));
            }
            socket.emit('connected', {
                gid: gid,
                uid: response.id,
                avatar: response.avatar,
                name: response.name,
                lang: response.lang,
                dataGame: response.dataGame,
                colorGame: response.colorGame,
                sound: response.sound
            });
        }.bind(this));
    };

    Module.prototype.joinHome = function (socket) {
        if (this.getUserGame(socket.uid)) {
            return;
        }
        socket.join('home', function () {
            socket.emit('listGames', moduleGame.createdGame);
            this.listChallengers();
            socket.emit('countConnected', Object.keys(this.connected).length);
            socket.emit('countGames', Object.keys(moduleGame.games).length);
        }.bind(this));
    };

    Module.prototype.refreshUser = function (socket) {
        return db.findOne('users', { _id: db.objectId(socket.uid) }, 'blitz rapid unauthorized blackList trophies')
        .then(function (response) {
            return this.init(socket, response);
        }.bind(this));
    };

    Module.prototype.updateUser = function (socket, data) {

        var saveData = {};

        if (data.edited) {
            saveData.edited = true;
        }

        if (typeof data.avatar === 'string' && 
            utils.patterns.avatar.test(data.avatar)) {
            saveData.avatar = data.avatar.trim();
        }

        if (typeof data.lang === 'string') {
            saveData.lang = data.lang.substr(0, 2);
        }

        if (typeof data.dataGame === 'object') {
            saveData.dataGame = {
                color: typeof data.dataGame.color !== 'string' ? null : data.dataGame.color,
                game: typeof data.dataGame.game !== 'number' ? 0 : data.dataGame.game,
                pointsMin: typeof data.dataGame.pointsMin !== 'number' ? null : data.dataGame.pointsMin,
                pointsMax: typeof data.dataGame.pointsMax !== 'number' ? null : data.dataGame.pointsMax
            };
        }

        if (typeof data.colorGame === 'string') {
            saveData.colorGame = data.colorGame;
        }

        if (typeof data.sound === 'boolean') {
            saveData.sound = data.sound;
        }

        if (Object.keys(saveData).length) {
            return db.update('users', { _id: db.objectId(socket.uid) }, saveData).then(function () {
                Object.assign(data, saveData);
                if (data.name) {
                    socket.name = data.name;
                }
                if (data.avatar) {
                    socket.avatar = data.avatar;
                }
                return data;
            });
        }
    };

    Module.prototype.init = function (socket, data) {

        if (data.unauthorized) {
            socket.emit('unauthorized');
            return;
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

        return db.all([
            db.count('users', { active_blitz: true, blitz: { $gt: data.blitz } }),
            db.count('users', { active_rapid: true, rapid: { $gt: data.rapid } })
        ])
        .then(function (response) {

            socket.blitz.ranking = response[0] + 1;
            socket.rapid.ranking = response[1] + 1;

            socket.emit('user', {
                blitz: socket.blitz,
                rapid: socket.rapid,
                blackList: socket.blackList,
                favorites: socket.favorites,
                trophies: data.trophies
            });

            socket.emit('challenges', socket.challenges);

            return data;
        });
    };

    Module.prototype.addFavorite = function (socket, uid) {
        
        if (!db.isObjectId(uid) ||
            socket.favorites.indexOf(uid) !== -1) {
            return;
        }

        socket.favorites.push(uid);

        db.update('users', { _id: db.objectId(socket.uid) }, {
            favorites: socket.favorites
        });
    };

    Module.prototype.removeFavorite = function (socket, uid) {
        
        var index = socket.favorites.indexOf(uid);

        if (index === -1) {
            return;
        }

        socket.favorites.splice(index, 1);

        db.update('users', { _id: db.objectId(socket.uid) }, {
            favorites: socket.favorites
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
        this.listChallengers();
        
        this.deleteChallenges(socket);
        this.deleteChallenges(socketOpponent);

        var white, 
            black, 
            color = dataGame.color, 
            type = dataGame.game.type;

        if (!color) {
            color = moduleGame.getRandomColor();
        }

        if (color === 'white') {
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

            game.rematch = {
                game: dataGame.game.index,
                color: dataGame.color
            };

            return db.save('games', {
                type: game.type,
                date: new Date(),
                white: white.uid,
                black: black.uid,
                data: game
            })
        }).
        then(function (response) {

            var room = moduleGame.getRoom(response.id);

            moduleGame.setGame(response.id, game);

            io.to('home').emit('countGames', Object.keys(moduleGame.games).length);

            this.userGames[socket.uid] = response.id;
            this.userGames[socketOpponent.uid] = response.id;

            this.listChallengers();

            socket.join(room);
            socketOpponent.join(room);

            this.setTimeoutGame(game);

            io.to(room).emit('startGame', response.id);
        }.bind(this));
    };

    Module.prototype.clearTimeoutGame = function (gid) {
        if (this.timeout[gid]) {
            clearTimeout(this.timeout[gid]);
        }
        delete this.timeout[gid];
    };

    Module.prototype.setTimeoutGame = function (game) {

        this.clearTimeoutGame(game.id);

        if (game.finish) {
            return;
        }

        if (game[game.turn].timeTurn > 0) {
            this.timeout[game.id] = setTimeout(function() {
                this.timeoutGame(game);
            }.bind(this), game[game.turn].timeTurn);
        } else {
            this.timeoutGame(game);
        }
    };

    Module.prototype.timeoutGame = function (game) {
        
        var player = game[game.turn],
            color = game.turn === 'white' ? 'black' : 'white';

        player.time = 0;
        player.timeTurn = 0;

        game.finish = true;
        game.result.value = (game[game.turn].possibleDraw || game[color].nbPieces === 1) ? 0 : (color === 'white' ? 1 : 2);
        game.result.name = game.result.value === 0 ? 'null' : 'time';
        this.finishGame(game);
        
        io.to(moduleGame.getRoom(game.id)).emit('game', game);
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
        this.setTimeoutGame(game);
        db.update('games', { _id: db.objectId(game.id) }, {
            data: game
        });
    };

    Module.prototype.finishGame = function (game) {

        this.clearTimeoutGame(game.id);

        var white = game.white,
            black = game.black,
            result = game.result.value,
            hashGame = null,
            data;

        if (result !== 0 && (game.played.length < 4 || new Date().getTime() - game.startTime < game.timeTurn)) {
            hashGame = '';
            game.played.forEach(function (value) {
                hashGame += value.hash;
            });
            hashGame = JSON.stringify(hashGame).hash();
        }

        moduleGame.deleteGame(game.id);
        io.to('home').emit('countGames', Object.keys(moduleGame.games).length);

        delete this.userGames[white.uid];
        delete this.userGames[black.uid];

        this.listChallengers();

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
            db.findOne('users', { _id: db.objectId(white.uid) }),
            db.findOne('users', { _id: db.objectId(black.uid) }),
            db.update('games', { _id: db.objectId(game.id) }, {
                result: result,
                data: game
            })
        ]).then(function (response) {

            data.white.success = this.getNewSuccess(response[0].success, result, 1);
            data.black.success = this.getNewSuccess(response[1].success, result, 2);
            data.white.blackList = this.getNewBlackList(response[0].blackList, response[0].lastGame, hashGame, game, 'white');
            data.black.blackList = this.getNewBlackList(response[1].blackList, response[1].lastGame, hashGame, game, 'black');
            data.white.countGame = white.countGame + 1;
            data.black.countGame = black.countGame + 1;

            var socketWhite = this.getSocket(white.uid),
                socketBlack = this.getSocket(black.uid),
                reverseType = game.type === 'blitz' ? 'rapid' : 'blitz';

            this.setTrophies(
                white.uid, 
                response[0].trophies, 
                data.white.success, 
                data.white.points > response[0][reverseType] ? data.white.points : response[0][reverseType],
                socketWhite
            );

            this.setTrophies(
                black.uid, 
                response[1].trophies,
                data.black.success, 
                data.black.points > response[1][reverseType] ? data.black.points : response[1][reverseType],
                socketBlack
            );

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
                db.update('users', { _id: db.objectId(white.uid) }, whiteData),
                db.update('users', { _id: db.objectId(black.uid) }, blackData)
            ]).then(function () {
                if (socketWhite) {
                    this.refreshUser(socketWhite);
                }

                if (socketBlack) {
                    this.refreshUser(socketBlack);
                }
            }.bind(this));
        }.bind(this));
    };

    Module.prototype.getGame = function (socket, gid) {

        var objectId = db.objectId(gid);

        if (!objectId) {
            socket.emit('game', false);
            return;
        }

        db.findOne('games', { _id: objectId }).then(function (response) {

            if (!response) {
                socket.emit('game', false);
                return;
            }

            response.data.archived = true;

            socket.emit('game', response.data);
        });
    };

    Module.prototype.setChallenge = function (socket, value) {

        this.deleteChallenge(socket, value.uid);

        socket.challenges.push(value);

        if (socket.challenges.length > 10) {
            socket.challenges.shift();
        }
    };

    Module.prototype.deleteChallenges = function (socket) {

        if (!this.checkSocket(socket)) {
            return;
        }

        for (var i = 0; i < socket.challenges.length; i++) {
            this.deleteChallenge(this.getSocket(socket.challenges[i].uid), socket.uid);
        }

        socket.challenges = [];
    };

    Module.prototype.deleteChallenge = function (socket, uid) {

        if (!socket) {
            return;
        }

        for (var i = 0; i < socket.challenges.length; i++) {
            if (socket.challenges[i].uid === uid) {
                socket.challenges.splice(i, 1);
                socket.emit('challenges', socket.challenges);
                break;
            }
        }
    };

    Module.prototype.getChallenge = function (socket, uid) {

        for (var i = 0; i < socket.challenges.length; i++) {
            if (socket.challenges[i].uid === uid) {
                return socket.challenges[i];
            }
        }
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

        var challengers = [];

        for (var socketId in io.sockets.connected) {
            var socket = io.sockets.connected[socketId];
            if (!socket || !socket.uid || this.userGames[socket.uid]) {
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
        }

        io.sockets.to('home').emit('challengers', challengers);
    };

    Module.prototype.profile = function (socket, uid) {

        var objectId = db.objectId(uid);

        if (!objectId) {
            return;
        }

        var data = {
            online: !!this.connected[uid],
            uid: uid
        };

        db.findOne('users', { _id: objectId }, 'name avatar blitz rapid facebookId trophies')
        .then(function (response) {

            data.name = response.name;
            data.avatar = response.avatar;
            data.facebookId = response.facebookId;

            data.blitz = {
                points: response.blitz
            };

            data.rapid = {
                points: response.rapid
            };

            data.trophies = response.trophies;

            return db.all([
                db.count('users', {
                    active_blitz: true,
                    blitz: {
                        $gt: data.blitz.points
                    }
                }),
                db.count('games', {
                    $and: [{
                        type: 'blitz',
                        result: {$exists: true}
                    },
                    {
                        $or: [{
                            white: uid
                        }, {
                            black: uid
                        }]
                    }]
                }),
                db.count('games', {
                    $and: [{
                        type: 'blitz'
                    },
                    {
                        $or: [{
                            white: uid,
                            result: 1
                        }, {
                            black: uid,
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
                            white: uid,
                            result: 0
                        }, {
                            black: uid,
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
                        type: 'rapid',
                        result: {$exists: true}
                    },
                    {
                        $or: [{
                            white: uid
                        }, {
                            black: uid
                        }]
                    }]
                }),
                db.count('games', {
                    $and: [{
                        type: 'rapid'
                    },
                    {
                        $or: [{
                            white: uid,
                            result: 1
                        }, {
                            black: uid,
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
                            white: uid,
                            result: 0
                        }, {
                            black: uid,
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

    Module.prototype.profileGames = function (socket, data) {

        if (typeof data !== 'object' || 
            typeof data.offset !== 'number') {
            return;
        }

        var objectId = db.objectId(data.uid);

        if (!objectId) {
            return;
        }

        var type = data.type === 'rapid' ? 'rapid' : 'blitz',
            request = [];

        request.push(db.find('games', {
            type: type,
            $or: [{
                white: data.uid
            }, {
                black: data.uid
            }]
        }).sort({date: -1}).limit(10).skip(parseInt(data.offset)));

        if (typeof data.count !== 'number') {
            request.push(db.count('games', {
                type: type,
                $or: [{
                    white: data.uid
                }, {
                    black: data.uid
                }]
            }));
        }

        db.all(request).then(function (response) {
            socket.emit('profileGames', {
                type: type,
                games: response[0],
                offset: data.offset + response[0].length,
                count: response[1] ? response[1] : data.count
            });
        });
    };

    Module.prototype.ranking = function (socket, data, limit, pages) {

        if (moduleGame.types.indexOf(data.type) === -1) {
            return;
        }

        var page = parseInt(data.page),
            limit = limit,
            user;

        if (page) {
            user = false;
            page = this.formatPage(page);
            this.initRanking(socket, page, limit, user, data.type, pages);
        } else {

            user = true;

            db.findOne('users', { _id: db.objectId(socket.uid) }, data.type)
            .then(function (response) {
                var req = {};
                req[data.type] = { $gt: response[data.type] };
                req['active_' + data.type] = true;
                return db.count('users', req);
            })
            .then(function (response) {
                page = this.formatPage(Math.ceil((response + 1) / limit));
                this.initRanking(socket, page, limit, user, data.type, pages);
            }.bind(this));
        }
    };

    Module.prototype.initRanking = function (socket, page, limit, user, type, pages) {

        var active = {},
            request,
            data,
            offset,
            total,
            position;

        active['active_' + type] = true;

        if (user) {
            request = { $and: [active, { _id: { $ne: db.objectId(socket.uid) } }] };
        } else {
            request = active;
        }

        db.count('users', request)
        .then(function (response) {

            if (response === 0) {
                var row = {
                    uid: socket.uid,
                    name: socket.name,
                    avatar: socket.avatar,
                    position: 1,
                    points: socket[type].points
                };
                socket.emit('ranking', {
                    ranking:[row]
                });
                throw Error();
            } 

            offset = (page * limit) - limit;

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
                ranking: this.getRanking(socket, data, position, response[1], user, type)
            };

            if (pages) {
                result.pages = this.getPages(total, offset, limit);
            }

            socket.emit('ranking', result);
        }.bind(this));
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


    Module.prototype.setTrophies = function (uid, oldTrophies, winsCons, points, socket) {

        var date = new Date();

        date.setDate(date.getDate() - 1);

        db.all([
            db.count('games', { $or: [{ white: uid }, { black: uid }] }),
            db.count('games', { $or: [{ $and: [{ black: uid, result: 2 }] }, { $and: [{ white: uid, result: 1 }] }] }),
            db.count('games', { $and: [{ date: { $gt: date } }, { $or: [{white: uid}, {black: uid}] } ]})
        ]).then(function (response) {

            var newTrophies = {},
                games = response[0],
                wins = response[1],
                gamesDay = response[2],
                trophies = {
                    1:  getProgression(1, games, 1),
                    2:  getProgression(2, games, 100),
                    3:  getProgression(3, games, 500),
                    4:  getProgression(4, games, 2000),
                    5:  getProgression(5, games, 5000),
                    6:  getProgression(6, wins, 1),
                    7:  getProgression(7, wins, 50),
                    8:  getProgression(8, wins, 250),
                    9:  getProgression(9, wins, 1000),
                    10: getProgression(10, wins, 2500),
                    11: getProgression(11, gamesDay, 5),
                    12: getProgression(12, gamesDay, 10),
                    13: getProgression(13, gamesDay, 25),
                    14: getProgression(14, gamesDay, 50),
                    15: getProgression(15, gamesDay, 100),
                    16: getProgression(16, winsCons, 2),
                    17: getProgression(17, winsCons, 5),
                    18: getProgression(18, winsCons, 10),
                    19: getProgression(19, winsCons, 15),
                    20: getProgression(20, winsCons, 20),
                    21: getProgression(21, points, 1600),
                    22: getProgression(22, points, 1800),
                    23: getProgression(23, points, 2000),
                    24: getProgression(24, points, 2400),
                    25: getProgression(25, points, 2800)
                };

            db.update('users', { _id: db.objectId(uid) }, { trophies: trophies })
            .then(function (response) {
                if (socket) {
                    socket.emit('trophies', {
                        trophies: trophies,
                        newTrophies: newTrophies,
                    });
                }
            });

            function getProgression(i, v, x) {
                var res = 100;

                if (oldTrophies && oldTrophies[i] === 100) {
                    return res;
                }

                res = Math.floor(v / x * 100);

                if (res > 100) {
                    res = 100;
                } else if (res < 0) {
                    res = 0;
                }

                if (res === 100) {
                    newTrophies[i] = res;
                }

                return res;
            }

        });
    };

    return new Module();
};
