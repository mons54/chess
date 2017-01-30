'use strict';

var chess = require(dirname + '/public/chess');

module.exports = new Game();

function Game() {
    
    this.options = chess.game.options;
    
    this.createdGame = {};

    this.gid = 1;

    this.games = {};
};

Game.prototype.getGames = function () {
    return this.games;
};

Game.prototype.create = function (socket, data) {
    
    var match,
        game = this.getGameType(data.game),
        color = this.getColor(data.color),
        pointsMin = data.pointsMin ? parseInt(data.pointsMin) : null,
        pointsMax = data.pointsMax ? parseInt(data.pointsMax) : null,
        uid = socket.uid,
        points = socket.points,
        blackList = socket.blackList;

    if (pointsMin) {
        if (pointsMin < this.options.pointsMin) {
            pointsMin = this.options.pointsMin;
        } 

        if (pointsMin > points) {
            pointsMin = points;
        }
    }

    if (pointsMax) {
        if (pointsMax > this.options.pointsMax) {
            pointsMax = this.options.pointsMax;
        }

        if (pointsMax <= pointsMin) {
            pointsMax = pointsMin + 100;
        }
    }

    for (var i in this.createdGame) {

        var value = this.createdGame[i];

        if (value.uid !== uid &&
            value.color === color &&
            value.game === game &&
            (!match || value.createAt < game.createAt) &&
            (!value.pointsMin || value.pointsMin <= points) &&
            (!value.pointsMax || value.pointsMax >= points) &&
            (!pointsMin || pointsMin <= value.points) &&
            (!pointsMax || pointsMax >= value.pointsMax) &&
            blackList.indexOf(value.uid) === -1 &&
            value.blackList.indexOf(uid) === -1) {
            match = value;
        }
    };

    this.createdGame[uid] = {
        uid: uid,
        points: points,
        avatar: socket.avatar,
        name: socket.name,
        ranking: socket.ranking,
        blackList: blackList,
        color: color,
        game: game,
        pointsMin: pointsMin,
        pointsMax: pointsMax,
        createAt: new Date().getTime()
    };

    return match;
};

Game.prototype.deleteCreatedGame = function (uid) {
    if (!this.createdGame[uid]) {
        return false;
    }

    delete this.createdGame[uid];

    return true;
};

Game.prototype.getGameType = function (game) {
    if (!this.options.games[game]) {
        game = 0;
    }
    return game;
};

Game.prototype.randomColor = function () {
    this.options.colors[Math.round(Math.random())];
};

Game.prototype.getColor = function (color) {
    if (this.options.colors.indexOf(color) === -1) {
        color = null;
    }
    return color;
};

Game.prototype.checkPoints = function (pointsMin, pointsMax) {
    if (!pointsMin || !pointsMax) {
        return true;
    }

    if (pointsMin < this.options.pointsMin || pointsMax > this.options.pointsMax) {
        return false;
    }

    return pointsMin < pointsMax;
};

Game.prototype.move = function (socket, id, start, end, promotion) {
    
    var game = this.getGame(id);

    if (!game || game.finish || game[game.turn].uid !== socket.uid) {
        return;
    }

    return new chess.engine(game, start, end, promotion);
};

Game.prototype.resign = function (socket, id) {
    
    var game = this.getGame(id);

    if (!game || 
        game.finish || 
        !this.isPlayer(game, socket.uid) || 
        game.played.length < 4 ||
        game.timestamp < 60) {
        return;
    }

    game.finish = true;

    if (this.getColorPlayer(game, socket.uid) === 'white') {
        game.result.value = 2;
    } else {
        game.result.value = 1;
    }

    game.result.name = 'resign';

    return game;
};

Game.prototype.offerDraw = function (socket, id) {

    var game = this.getGame(id);

    if (!game || game.finish || !this.isPlayer(game, socket.uid)) {
        return;
    }

    var player = this.getPlayer(game, socket.uid);

    if (player.offerDraw >= game.maxOfferDraw) {
        return;
    }

    player.offerDraw++;

    var opponent = this.getOpponent(game, socket.uid);

    opponent.possibleDraw = true;

    return opponent;
};

Game.prototype.acceptDraw = function (socket, id) {
    var game = this.getGame(id);

    if (!game || game.finish || !this.isPlayer(game, socket.uid)) {
        return;
    }

    var player = this.getPlayer(game, socket.uid);

    if (!player.possibleDraw) {
        return;
    }

    game.finish = true;
    game.result.value = 0;
    game.result.name = 'nulle';

    return game;
};

Game.prototype.isPlayer = function (game, uid) {
    return game.white.uid === uid || game.black.uid === uid;
};

Game.prototype.getColorPlayer = function (game, uid) {
    return game.white.uid === uid ? 'white' : 'black';
};

Game.prototype.getPlayer = function (game, uid) {
    return game.white.uid === uid ? game.white : game.black;
};

Game.prototype.getColorOpponent = function (game, uid) {
    return game.white.uid === uid ? 'black' : 'white';
};

Game.prototype.getOpponent = function (game, uid) {
    return game.white.uid === uid ? game.black : game.white;
};

Game.prototype.hasGame = function (gid) {
    return this.games.hasOwnProperty(gid);
};

Game.prototype.getGame = function (gid) {
    return this.hasGame(gid) ? this.games[gid].data : null;
};

Game.prototype.deleteGame = function (gid) {
    delete this.games[gid];
};

Game.prototype.getRoom = function (gid) {
    return 'game' + gid;
};

Game.prototype.getMessages = function (gid) {
    return this.hasGame(gid) ? this.games[gid].messages : null;
};

Game.prototype.setMessage = function (gid, data) {
    if (!this.hasGame(gid)) {
        return;
    }

    var messages = this.games[gid].messages;
    messages.push(data);
    if (messages.length > 50) {
        messages.splice(0, 1);
    }
};

Game.prototype.timer = function (game) {

    game.timestamp++;

    if (game[game.turn].time > 0 && game[game.turn].timeTurn > 0) {
        game[game.turn].time--;
        game[game.turn].timeTurn--;
        return false;
    } 
    
    var color = game.turn === 'white' ? 'black' : 'white';
    game.finish = true;
    game.result.value = (game[game.turn].possibleDraw || game[color].nbPieces === 1) ? 0 : (color === 'white' ? 1 : 2);
    game.result.name = game.result.value === 0 ? 'nulle' : 'time';
    return game;
};

Game.prototype.start = function (white, black, data) {

    var gid = this.gid++;

    this.games[gid] = {
        data: chess.game.newGame(gid, white, black, data),
        messages: []
    };

    return gid;
};

Game.prototype.getPoints = function (p1, p2, coefficient, countGame) {
    return chess.game.getPoints(p1, p2, coefficient, countGame);
};
