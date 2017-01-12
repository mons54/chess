'use strict';

module.exports = function (app, io) {

    var moduleSocket = require(dirname + '/server/modules/socket')(io),
        moduleGame   = require(dirname + '/server/modules/game');

    io.on('connection', function (socket) {

        socket.on('facebookConnect', function (data) {
            if (socket.unauthorized ||
                !data || 
                !data.id || 
                !data.accessToken) {
                socket.disconnect();
                return;
            }
            moduleSocket.facebookConnect(socket, data);
        });

        socket.on('googleConnect', function (data) {
            if (socket.unauthorized ||
                !data ||
                !data.accessToken) {
                socket.disconnect();
                return;
            }
            moduleSocket.googleConnect(socket, data);
        });

        socket.on('joinHome', function () {
            socket.join('home', moduleSocket.listChallengers);
            socket.emit('listGames', moduleGame.createdGame);
            socket.emit('listChallenges', socket.challenges);
        });

        socket.on('challenge', function (data) {

            if (!data || 
                !data.uid || 
                !moduleSocket.checkSocket(socket) || 
                moduleSocket.isBlackListed(socket, data.uid) ||
                moduleSocket.getUserGame(socket.uid)) {
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
                avatar: socket.avatar,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking,
                color: color,
                time: time
            });

            moduleSocket.setChallenges(socket, data.uid, {
                create: true,
                avatar: socketOpponent.avatar,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking,
                color: color,
                time: time
            });

            socketOpponent.emit('listChallenges', socketOpponent.challenges);
            socket.emit('listChallenges', socket.challenges);
        });

        socket.on('removeChallenge', function (uid) {
            if (moduleSocket.checkSocket(socket)) {
                moduleSocket.deleteChallenge(moduleSocket.getSocket(uid), socket.uid);
            }
            moduleSocket.deleteChallenge(socket, uid);
        });

        socket.on('leaveHome', function () {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }
            socket.leave('home');
            leaveHome();
        });

        socket.on('createGame', function (data) {
            if (!data || !moduleSocket.checkSocket(socket) || moduleSocket.getUserGame(socket.uid) || !moduleGame.create(socket, data)) {
                return;
            }
            moduleSocket.listGames(moduleGame.createdGame);
        });

        socket.on('removeGame', function () {
            if (!moduleSocket.checkSocket(socket)) {
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

            var challenge;

            if (challenge = moduleSocket.getChallenge(socketOpponent, socket.uid)) {
                moduleSocket.startGame(socket, socketOpponent, challenge);
            }
        });

        socket.on('initGame', function (gid) {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }
            socket.emit('game', moduleGame.getGame(gid));
        });

        socket.on('moveGame', function (data) {
            if (!moduleSocket.checkSocket(socket) || !data.id) {
                return;
            }

            var game = moduleGame.move(socket, data.id, data.start, data.end, data.promotion);

            if (!game) {
                return;
            }

            if (game[game.turn].possibleDraw) {
                var socketOpponent = moduleSocket.getSocket(game[game.turn].uid);
                if (socketOpponent) {
                    socketOpponent.emit('possibleDraw');
                }
            }

            if (game) {
                if (game.finish) {
                    moduleSocket.saveGame(game);
                }
                io.to(moduleGame.getRoom(data.id)).emit('game', game);
            }
        });

        socket.on('resign', function (gid) {

            if (!moduleSocket.checkSocket(socket) || !gid) {
                return;
            }

            var game = moduleGame.resign(socket, gid);

            if (game) {
                moduleSocket.saveGame(game);
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
                moduleSocket.saveGame(game);
                io.to(moduleGame.getRoom(gid)).emit('game', game);
            }
        });

        socket.on('profile', function (data) {
            if (!moduleSocket.checkSocket(socket) || !data || !data.uid) {
                return;
            }

            moduleSocket.profile(socket, data);
        });

        socket.on('ranking', function (data) {
            if (!moduleSocket.checkSocket(socket) || !data) {
                return;
            }
            moduleSocket.ranking(socket, data);
        });

        socket.on('disconnect', function () {
            if (!moduleSocket.checkSocket(socket)) {
                return;
            }
            delete moduleSocket.socketConnected[socket.uid];
            leaveHome();
        });

        function leaveHome() {
            moduleSocket.listChallengers();
            moduleSocket.deleteChallenges(socket);
            moduleGame.deleteCreatedGame(socket.uid);
            moduleSocket.listGames(moduleGame.createdGame);
        }
    });

    setInterval(function () {
        for (var key in moduleGame.games.data) {
            timer(moduleGame.games.data[key]);
        }
    }, 1000);

    function timer(game) {
        if (game.finish) {
            return;
        }

        var game = moduleGame.timer(game);

        if (game) {
            moduleSocket.saveGame(game);
            io.to(moduleGame.getRoom(game.id)).emit('game', game);
        }
    }
};
