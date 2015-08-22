module.exports = function (app, io, mongoose, fbgraph, q, crypto) {

    var moduleSocket = require(dirname + '/server/modules/socket')(io, mongoose, fbgraph),
        moduleGame   = require(dirname + '/server/modules/game')(),
        moduleUtils  = require(dirname + '/server/modules/utils')();

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

        socket.on('startGame', function (data) {
            if (!moduleSocket.checkSocketUid(socket) || moduleSocket.getUserGame(socket.uid) || !data || !data.uid || socket.uid === data.uid) {
                return;
            }

            var socketOpponent = moduleSocket.getSocket(data.uid);

            if (data.challenge)  {
                // start challenge
            } else {
                moduleSocket.startCreatedGame(data.uid, socket, socketOpponent);
            }
        });

        socket.on('initGame', function (gid) {
            moduleSocket.initGame(gid, socket);
        });

        socket.on('challenge', function (data) {

            if (!data || !moduleSocket.checkSocketUid(socket) || moduleSocket.getUserGame(socket.uid)) {
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

        socket.on('ranking', function (data) {
            if (!moduleSocket.checkSocketUid(socket) || !data) {
                return;
            }
            moduleSocket.ranking(socket, data);
        });

        socket.on('payment', function (data) {
            if (!moduleSocket.checkSocketUid(socket) || !data || !data.signed_request) {
                return;
            }

            var request = moduleUtils.parseSignedRequest(data.signed_request),
                item    = app.itemsAmount[parseFloat(request.amount)];

            if (!request || !item) {
                return;
            }

            moduleSocket.payment(socket, request, item);
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
};
