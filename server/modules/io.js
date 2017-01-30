'use strict';

module.exports = function (app, io) {

    var moduleSocket = require(dirname + '/server/modules/socket')(io),
        moduleGame   = require(dirname + '/server/modules/game');

    io.on('connection', function (socket) {

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

        socket.on('joinHome', function (refresh) {
            if (refresh) {
                moduleSocket.refreshUser(socket)
                .then(function() {
                    moduleSocket.joinHome(socket);
                });
            } else {
                moduleSocket.joinHome(socket);
            }
        });

        socket.on('challenge', function (data) {

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
                socket.blackList.indexOf(data.uid) !== -1 ||
                socketOpponent.blackList.indexOf(socket.uid) !== -1) {
                return;
            }

            var challenge = moduleSocket.getChallenge(socket, socketOpponent.uid);

            if (challenge &&
                challenge.color === color &&
                challenge.game === game) {
                moduleSocket.startGame(socket, socketOpponent, challenge);
                return;
            }

            moduleSocket.setChallenge(socketOpponent, socket.uid, {
                avatar: socket.avatar,
                name: socket.name,
                points: socket.points,
                ranking: socket.ranking,
                color: color,
                game: game
            });

            moduleSocket.setChallenge(socket, data.uid, {
                avatar: socketOpponent.avatar,
                name: socketOpponent.name,
                points: socketOpponent.points,
                ranking: socketOpponent.ranking,
                color: color,
                game: game
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

        socket.on('startGame', function (uid) {
            if (!moduleSocket.checkStartGame(socket, uid)) {
                return;
            }

            var createdGame = moduleGame.createdGame[uid];

            if (!createdGame || 
                socket.blackList.indexOf(uid) !== -1 || 
                createdGame.blackList.indexOf(socket.uid) !== -1) {
                return;
            }

            startGame(createdGame);
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

            var game = moduleGame.getGame(gid);

            if (game) {
               socket.join(moduleGame.getRoom(gid)); 
            }

            socket.emit('game', game);
            socket.emit('messagesGame', moduleGame.getMessages(gid));
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
                time = new Date().getTime(),
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

            delete moduleSocket.connected[socket.uid];
            moduleSocket.listChallengers();
            
            moduleSocket.deleteChallenges(socket);

            if (moduleGame.deleteCreatedGame(socket.uid)) {
                moduleSocket.listGames();
            }
        });

        function startGame(game) {
            var socketOpponent = moduleSocket.getSocket(game.uid);
            if (socketOpponent && !moduleSocket.getUserGame(socketOpponent.uid)) {
                moduleSocket.startGame(socket, socketOpponent, game);
            } else {
                moduleGame.deleteCreatedGame(game.uid);
            }
        }
    });

    setInterval(function () {
        var games = moduleGame.getGames();
        for (var key in games) {
            timer(games[key].data);
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
