'use strict';

module.exports = function (app, io) {

    var q = require('q'),
        moduleSocket = require(dirname + '/server/modules/socket')(io),
        moduleGame   = require(dirname + '/server/modules/game');

    io.on('connection', function (socket) {

        socket.on('time', function (data, callback) {
            callback(Date.now());
        });

        socket.on('facebookConnect', function (data) {
            if (!data || 
                !data.id || 
                !data.accessToken) {
                return;
            }
            moduleSocket.facebookConnect(socket, data);
        });

        socket.on('googleConnect', function (data) {
            if (!data ||
                !data.accessToken) {
                return;
            }
            moduleSocket.googleConnect(socket, data);
        });

        socket.on('vkontakteConnect', function (data) {
            if (!data ||
                !data.user) {
                return;
            }
            moduleSocket.vkontakteConnect(socket, data);
        });

        socket.on('okruConnect', function (data) {
            if (!data) {
                return;
            }
            moduleSocket.okruConnect(socket, data);
        });

        socket.on('updateUser', function (data, callback) {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }

            var response = moduleSocket.updateUser(socket, data);

            if (response) {
                response.then(callback);
            }
        });

        socket.on('leaveHome', function () {
            socket.leave('home');
        });

        socket.on('joinHome', function (refresh) {
            
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }

            if (refresh) {
                moduleSocket.refreshUser(socket)
                .then(function(response) {
                    if (!response) {
                        return;
                    }
                    moduleSocket.joinHome(socket);
                });
            } else {
                moduleSocket.joinHome(socket);
            }
        });

        socket.on('addFavorite', function (uid) {

            if (!moduleSocket.checkSocket(socket) ||
                typeof uid !== 'string') {
                return;
            }

            moduleSocket.addFavorite(socket, uid);
        });

        socket.on('removeFavorite', function (uid) {

            if (!moduleSocket.checkSocket(socket) ||
                typeof uid !== 'string') {
                return;
            }

            moduleSocket.removeFavorite(socket, uid);
        });

        socket.on('addBlackList', function (uid) {

            if (!moduleSocket.checkSocket(socket) ||
                typeof uid !== 'string') {
                return;
            }

            moduleSocket.addBlackList(socket, uid);
        });

        socket.on('removeBlackList', function (uid) {

            if (!moduleSocket.checkSocket(socket) ||
                typeof uid !== 'string') {
                return;
            }

            moduleSocket.removeBlackList(socket, uid);
        });

        socket.on('createChallenge', function (data) {

            if (!data || 
                !data.uid || 
                !moduleSocket.checkSocket(socket) || 
                moduleSocket.getUserGame(socket.uid)) {
                return;
            }

            var socketOpponent = moduleSocket.getSocket(data.uid),
                color = moduleGame.getColor(data.color),
                game = moduleGame.getGameType(data.game);

            if (!socketOpponent ||
                socket.blackList.hasOwnProperty(data.uid) ||
                socketOpponent.blackList.hasOwnProperty(socket.uid)) {
                return;
            }

            var challenge = moduleSocket.getChallenge(socket, socketOpponent.uid);

            if (challenge &&
                !challenge.create &&
                challenge.game.index === game.index &&
                (!color || !challenge.color || color !== challenge.color)) {
                moduleSocket.startGame(socket, socketOpponent, challenge);
                return;
            }

            moduleSocket.setChallenge(socketOpponent, {
                create: false,
                uid: socket.uid,
                avatar: socket.avatar,
                name: socket.name,
                points: socket[game.type].points,
                color: color,
                game: game
            });

            moduleSocket.setChallenge(socket, {
                create: true,
                uid: socketOpponent.uid,
                avatar: socketOpponent.avatar,
                name: socketOpponent.name,
                points: socketOpponent[game.type].points,
                color: color,
                game: game
            });

            socketOpponent.emit('challenges', socketOpponent.challenges);
            socket.emit('challenges', socket.challenges);
        });

        socket.on('removeChallenge', function (uid) {
            if (moduleSocket.checkSocket(socket)) {
                moduleSocket.deleteChallenge(moduleSocket.getSocket(uid), socket.uid);
            }
            moduleSocket.deleteChallenge(socket, uid);
        });

        socket.on('startChallenge', function (uid, callback) {
            if (!moduleSocket.checkSocket(socket) ||
                !moduleSocket.checkStartGame(socket, uid)) {
                callback(false);
                return;
            }

            var socketOpponent = moduleSocket.getSocket(uid);

            if (!socketOpponent) {
                moduleSocket.deleteChallenge(socket, uid);
                callback(false);
                return;
            }

            if (moduleSocket.getUserGame(socketOpponent.uid)) {
                moduleSocket.deleteChallenges(socketOpponent);
                callback(false);
                return;
            }

            var challenge = moduleSocket.getChallenge(socketOpponent, socket.uid);

            if (!challenge || !challenge.create) {
                callback(false);
                return;
            }

            moduleSocket.startGame(socket, socketOpponent, challenge);
        });

        socket.on('createGame', function (data) {
            if (!data || !moduleSocket.checkSocket(socket) || moduleSocket.getUserGame(socket.uid)) {
                return;
            }

            var game = moduleGame.create(socket, data);

            if (game) {
                startGame(game);
                return;
            }

            moduleSocket.listGames();
        });

        socket.on('removeGame', function () {
            if (!moduleSocket.checkSocket(socket) || !moduleGame.deleteCreatedGame(socket.uid)) {
                return;
            }
            
            moduleSocket.listGames();
        });

        socket.on('startGame', function (uid, callback) {
            if (!moduleSocket.checkStartGame(socket, uid)) {
                callback(false);
                return;
            }

            var createdGame = moduleGame.createdGame[uid];

            if (!createdGame || 
                socket.blackList.hasOwnProperty(uid) || 
                createdGame.blackList.hasOwnProperty(socket.uid)) {
                callback(false);
                return;
            }

            startGame(createdGame).then(callback);
        });

        socket.on('initGame', function (gid) {
            if (typeof gid !== 'string' || !moduleSocket.checkSocket(socket)) {
                return;
            }

            var game = moduleGame.getGame(gid);

            if (game) {
                socket.join(moduleGame.getRoom(gid));
                moduleGame.setTimeTurn(game);
                socket.emit('game', game);
                socket.emit('messagesGame', moduleGame.getMessages(gid));
            } else {
                moduleSocket.getGame(socket, gid);
            }
        });

        socket.on('leaveGame', function (gid) {
            if (typeof gid !== 'string') {
                return;
            }
            socket.leave(moduleGame.getRoom(gid));
        });

        socket.on('moveGame', function (data) {
            if (!moduleSocket.checkSocket(socket) || !data.id) {
                return;
            }

            var game = moduleGame.move(socket, data.id, data.start, data.end, data.promotion);

            if (!game) {
                return;
            }

            if (game[game.turn] && game[game.turn].possibleDraw) {
                var socketOpponent = moduleSocket.getSocket(game[game.turn].uid);
                if (socketOpponent) {
                    socketOpponent.emit('possibleDraw');
                }
            }

            if (game.finish) {
                moduleSocket.finishGame(game);
            } else {
                moduleSocket.saveGame(game);
            }
                
            io.to(moduleGame.getRoom(data.id)).emit('game', game);
        });

        socket.on('sendMessageGame', function (data) {

            if (!data || !data.gid || !data.message || typeof data.message !== 'string' || !data.message.length || !moduleSocket.checkSocket(socket)) {
                return;
            }

            var gid = data.gid,
                message = data.message.replace(/<(?:.|\n)*?>/gm, '').substr(0, 250),
                time = Date.now(),
                data = {
                    uid: socket.uid,
                    name: socket.name,
                    avatar: socket.avatar,
                    message: message,
                    time: time
                };

            moduleGame.setMessage(gid, data);

            io.to(moduleGame.getRoom(gid)).emit('messageGame', data);
        });

        socket.on('resign', function (gid) {

            if (!moduleSocket.checkSocket(socket) || !gid) {
                return;
            }

            var game = moduleGame.resign(socket, gid);

            if (game) {
                moduleSocket.finishGame(game);
                io.to(moduleGame.getRoom(gid)).emit('game', game);
            }
        });

        socket.on('offerDraw', function (gid) {
            
            if (!moduleSocket.checkSocket(socket) || !gid) {
                return;
            }

            var player = moduleGame.offerDraw(socket, gid);

            if (player) {
                var socketOpponent = moduleSocket.getSocket(player.uid);
                if (socketOpponent) {
                    socketOpponent.emit('offerDraw');
                }
            }
        });

        socket.on('acceptDraw', function (gid) {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }

            var game = moduleGame.acceptDraw(socket, gid);
            if (game) {
                moduleSocket.finishGame(game);
                io.to(moduleGame.getRoom(gid)).emit('game', game);
            }
        });

        socket.on('profile', function (uid) {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }

            moduleSocket.profile(socket, uid);
        });

        socket.on('profileGames', function (data) {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }

            moduleSocket.profileGames(socket, data);
        });

        socket.on('ranking', function (data) {
            if (!moduleSocket.checkSocket(socket) || !data) {
                return;
            }
            moduleSocket.ranking(socket, data, 10, true);
        });

        socket.on('rankingTop100', function (type) {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }
            moduleSocket.ranking(socket, {
                type: type,
                page: 1
            }, 100, false);
        });

        socket.on('disconnect', function () {

            if (!moduleSocket.checkSocket(socket)) {
                return;
            }

            delete moduleSocket.connected[socket.uid];
            io.to('home').emit('countConnected', Object.keys(moduleSocket.connected).length);
            
            moduleSocket.listChallengers();
            
            moduleSocket.deleteChallenges(socket);

            if (moduleGame.deleteCreatedGame(socket.uid)) {
                moduleSocket.listGames();
            }
        });

        function startGame(game) {

            var deferred = q.defer(),
                socketOpponent = moduleSocket.getSocket(game.uid);

            if (socketOpponent && !moduleSocket.getUserGame(socketOpponent.uid)) {
                moduleSocket.startGame(socket, socketOpponent, game).then(deferred.resolve).catch(deferred.resolve);
            } else {
                deferred.resolve(moduleGame.deleteCreatedGame(game.uid));
            }

            return deferred.promise;
        }
    });
};
