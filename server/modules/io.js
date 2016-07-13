'use strict';

module.exports = function (app, io, mongoose, fbgraph, q, crypto) {

    var moduleSocket = require(dirname + '/server/modules/socket')(io, mongoose, fbgraph),
        moduleGame   = require(dirname + '/server/modules/game')();

    io.on('connection', function (socket) {

        socket.on('init', function (data) {
            if (!data || !data.uid || !data.accessToken) {
                moduleSocket.disconnectSocket(socket);
                return;
            }
            moduleSocket.init(socket, data);
        });

        socket.on('initUser', function () {
            moduleSocket.initUser(socket);
        });

        socket.on('challenge', function (data) {

            if (!data || !data.uid || !moduleSocket.checkSocketUid(socket) || moduleSocket.getUserGame(socket.uid)) {
                return;
            }

            var socketOpponent = moduleSocket.getSocket(data.uid),
                color = data.color,
                time = moduleGame.getTime(data.time);

            if (!socketOpponent || !moduleGame.checkColor(color) || !moduleGame.checkColor(color)) {
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

        socket.on('leaveHome', function () {
            if (!moduleSocket.checkSocketUid(socket)) {
                return;
            }
            socket.leave('home');
            moduleSocket.listChallengers();
            moduleGame.deleteCreatedGame(socket.uid);
            moduleSocket.listGames(moduleGame.createdGame);
            moduleSocket.deleteChallenges(socket);
        });

        socket.on('createGame', function (data) {
            if (!data || !moduleSocket.checkSocketUid(socket) || moduleSocket.getUserGame(socket.uid) || !moduleGame.create(socket, data)) {
                return;
            }
            moduleSocket.listGames(moduleGame.createdGame);
        });

        socket.on('removeGame', function () {
            if (!moduleSocket.checkSocketUid(socket)) {
                return;
            }
            moduleGame.deleteCreatedGame(socket.uid);
            moduleSocket.listGames(moduleGame.createdGame);
        });

        socket.on('startGame', function (uid) {
            if (!moduleSocket.checkStartGame(socket, uid) || !moduleGame.createdGame[uid]) {
                return;
            }

            var socketOpponent = moduleSocket.getSocket(uid);

            if (socketOpponent && !moduleSocket.getUserGame(socketOpponent.uid)) {
                moduleSocket.startGame(socket, socketOpponent, moduleGame.createdGame[uid]);
            } else {
                moduleGame.deleteCreatedGame(uid);
            }
        });

        socket.on('startChallenge', function (uid) {
            if (!moduleSocket.checkStartGame(socket, uid)) {
                return;
            }

            var socketOpponent = moduleSocket.getSocket(uid);

            if (!socketOpponent) {
                moduleSocket.deleteChallenge(socket, uid);
                return;
            }

            if (moduleSocket.getUserGame(socketOpponent.uid)) {
                moduleSocket.deleteChallenges(socketOpponent);
                return;
            }

            if (challenge = moduleSocket.getChallenge(socketOpponent, socket.uid)) {
                moduleSocket.startGame(socket, socketOpponent, challenge);
            }
        });

        socket.on('initGame', function (gid) {
            if (!moduleSocket.checkSocketUid(socket)) {
                return;
            }
            socket.emit('game', moduleGame.getGame(gid));
        });

        socket.on('moveGame', function (data) {
            if (!moduleSocket.checkSocketUid(socket) || !data.id) {
                return;
            }

            var game = moduleGame.move(socket, data.id, data.start, data.end, data.promotion);

            if (game) {
                if (game.finish) {
                    moduleSocket.saveGame(game);
                }
                io.to(moduleGame.getRoom(data.id)).emit('game', game);
            }
        });

        socket.on('resign', function (gid) {

            if (!moduleSocket.checkSocketUid(socket) || !gid) {
                return;
            }

            var game = moduleGame.resign(socket, gid);

            if (game) {
                moduleSocket.saveGame(game);
                io.to(moduleGame.getRoom(gid)).emit('game', game);
            }
        });

        socket.on('offerDraw', function (gid) {
            
            if (!moduleSocket.checkSocketUid(socket) || !gid) {
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
            if (!moduleSocket.checkSocketUid(socket)) {
                return;
            }

            var game = moduleGame.acceptDraw(socket, gid);
            if (game) {
                moduleSocket.saveGame(game);
                io.to(moduleGame.getRoom(gid)).emit('game', game);
            }
        });

        socket.on('profil', function (uid) {
            if (!moduleSocket.checkSocketUid(socket) || !uid) {
                return;
            }

            moduleSocket.profil(socket, uid);
        });

        socket.on('ranking', function (data) {
            if (!moduleSocket.checkSocketUid(socket) || !data) {
                return;
            }
            moduleSocket.ranking(socket, data);
        });

        socket.on('disconnect', function () {
            if (moduleSocket.checkSocketUid(socket)) {
                delete moduleSocket.socketConnected[socket.uid];
                moduleGame.deleteCreatedGame(socket.uid);
                moduleSocket.listGames(moduleGame.createdGame);
            }
            moduleSocket.deleteChallenges(socket);
        });
    });

    setInterval(function () {
        for (var key in moduleGame.games.data) {
            timer(moduleGame.games.data[key]);
        }
    }, 1000);

    function timer(game) {
        if (game.finish) {
            moduleGame.deleteGame(game.id);
            return;
        }

        var game = moduleGame.timer(game);

        if (game) {
            moduleSocket.saveGame(game);
            io.to(moduleGame.getRoom(game.id)).emit('game', game);
        }
    }
};
