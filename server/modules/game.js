'use strict';

module.exports = new Game();

function Game() {
    this.options = {
        colors: ['white', 'black'],
        times: [300, 600, 1200, 3600, 5400],
        pointsMin: 1200,
        pointsMax: 3000
    };
    
    this.createdGame = {};

    this.games = {
        id: 1,
        data: {}
    };
};

var Engine = require(dirname + '/server/modules/game/engine');

Game.prototype.getGames = function () {
    return this.games.data;
};

Game.prototype.create = function (socket, data) {
    
    var color = data.color, 
        time = this.getTime(data.time), 
        pointsMin = parseInt(data.pointsMin) ? data.pointsMin : false,
        pointsMax = parseInt(data.pointsMax) ? data.pointsMax : false;

    if (!this.checkColor(color) || !this.checkTime(time) || !this.checkPoints(pointsMin, pointsMax)) {
        return false;
    }

    this.createdGame[socket.uid] = {
        avatar: socket.avatar,
        name: socket.name,
        points: socket.points,
        ranking: socket.ranking,
        color: color,
        time: time,
        pointsMin: pointsMin,
        pointsMax: pointsMax,
    };

    return true;

};

Game.prototype.deleteCreatedGame = function (uid) {
    if (!this.createdGame[uid]) {
        return;
    }

    delete this.createdGame[uid];
};

Game.prototype.getTime = function (time) {
    return parseInt(time);
};

Game.prototype.checkColor = function (color) {
    if (this.options.colors.indexOf(color) === -1) {
        return false;
    }
    return true;
};

Game.prototype.checkTime = function (time) {
    if (this.options.times.indexOf(time) === -1) {
        return false;
    }
    return true;
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

    // voir si son temps est dépassé
    if (!game || game.finish || game[game.turn].uid !== socket.uid) {
        return;
    }

    game = new Engine(game, start, end, promotion);

    return game;
};

Game.prototype.resign = function (socket, id) {
    
    var game = this.getGame(id);

    if (!game || game.finish || !this.isPlayer(game, socket.uid) || !game.played) {
        return;
    }

    game.finish = true;

    if (this.getColorPlayer(game, socket.uid) === 'white') {
        game.result.winner = 2;
    } else {
        game.result.winner = 1;
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

    opponent.canDraw = true;

    return opponent;
};

Game.prototype.acceptDraw = function (socket, id) {
    var game = this.getGame(id);

    if (!game || game.finish || !this.isPlayer(game, socket.uid)) {
        return;
    }

    var player = this.getPlayer(game, socket.uid);

    if (!player.canDraw) {
        return;
    }

    game.finish = true;
    game.result.winner = 0;
    game.result.name = 'draw';

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

Game.prototype.getGame = function (gid) {
    return this.games.data[gid];
};

Game.prototype.deleteGame = function (gid) {
    delete this.games.data[gid];
};

Game.prototype.getRoom = function (gid) {
    return 'game' + gid;
};

Game.prototype.start = function (white, black, time) {

    var gid = this.games.id++,
        timeTurn = 120,
        nbPieces = 16;

    var game = {
        id: gid,
        time: time,
        timeTurn: timeTurn,
        finish: false,
        turn: 'white',
        turn50: 0,
        played: 0,
        maxOfferDraw: 3,
        saved: {},
        result: {},
        lastTurn: {
            start: null,
            end: null
        },
        white: {
            uid: white.uid,
            name: white.name,
            avatar: white.avatar,
            points: white.points,
            ranking: white.ranking,
            time: time,
            timeTurn: timeTurn,
            canDraw: false,
            king: {
                position: 'e1',
                moveForbidden: []
            },
            nbPieces: nbPieces,
            offerDraw: 0,
            notation: []
        },
        black: {
            uid: black.uid,
            name: black.name,
            avatar: black.avatar,
            points: black.points,
            ranking: black.ranking,
            time: time,
            timeTurn: timeTurn,
            canDraw: false,
            king: {
                position: 'e8',
                moveForbidden: []
            },
            nbPieces: nbPieces,
            offerDraw: 0,
            notation: []
        },
        pieces: {
            e1: {
                name: 'king',
                color: 'white',
                deplace: [],
                capture: [],
                moved: false
            },
            e8: {
                name: 'king',
                color: 'black',
                deplace: [],
                capture: [],
                moved: false
            },
            d1: {
                name: 'queen',
                color: 'white',
                deplace: [],
                capture: [],
                moved: false
            },
            d8: {
                name: 'queen',
                color: 'black',
                deplace: [],
                capture: [],
                moved: false
            },
            a1: {
                name: 'rook',
                color: 'white',
                deplace: [],
                capture: [],
                moved: false
            },
            h1: {
                name: 'rook',
                color: 'white',
                deplace: [],
                capture: [],
                moved: false
            },
            a8: {
                name: 'rook',
                color: 'black',
                deplace: [],
                capture: [],
                moved: false
            },
            h8: {
                name: 'rook',
                color: 'black',
                deplace: [],
                capture: [],
                moved: false
            },
            c1: {
                name: 'bishop',
                color: 'white',
                deplace: [],
                capture: [],
                moved: false
            },
            f1: {
                name: 'bishop',
                color: 'white',
                deplace: [],
                capture: [],
                moved: false
            },
            c8: {
                name: 'bishop',
                color: 'black',
                deplace: [],
                capture: [],
                moved: false
            },
            f8: {
                name: 'bishop',
                color: 'black',
                deplace: [],
                capture: [],
                moved: false
            },
            b1: {
                name: 'knight',
                color: 'white',
                deplace: ['a3', 'c3'],
                capture: [],
                moved: false
            },
            g1: {
                name: 'knight',
                color: 'white',
                deplace: ['f3', 'h3'],
                capture: [],
                moved: false
            },
            b8: {
                name: 'knight',
                color: 'black',
                deplace: ['a6', 'c6'],
                capture: [],
                moved: false
            },
            g8: {
                name: 'knight',
                color: 'black',
                deplace: ['f6', 'h6'],
                capture: [],
                moved: false
            },
            a2: {
                name: 'pawn',
                color: 'white',
                deplace: ['a3', 'a4'],
                capture: [],
                moved: false
            },
            b2: {
                name: 'pawn',
                color: 'white',
                deplace: ['b3', 'b4'],
                capture: [],
                moved: false
            },
            c2: {
                name: 'pawn',
                color: 'white',
                deplace: ['c3', 'c4'],
                capture: [],
                moved: false
            },
            d2: {
                name: 'pawn',
                color: 'white',
                deplace: ['d3', 'd4'],
                capture: [],
                moved: false
            },
            e2: {
                name: 'pawn',
                color: 'white',
                deplace: ['e3', 'e4'],
                capture: [],
                moved: false
            },
            f2: {
                name: 'pawn',
                color: 'white',
                deplace: ['f3', 'f4'],
                capture: [],
                moved: false
            },
            g2: {
                name: 'pawn',
                color: 'white',
                deplace: ['g3', 'g4'],
                capture: [],
                moved: false
            },
            h2: {
                name: 'pawn',
                color: 'white',
                deplace: ['h3', 'h4'],
                capture: [],
                moved: false
            },
            a7: {
                name: 'pawn',
                color: 'black',
                deplace: ['a6', 'a5'],
                capture: [],
                moved: false
            },
            b7: {
                name: 'pawn',
                color: 'black',
                deplace: ['b6', 'b5'],
                capture: [],
                moved: false
            },
            c7: {
                name: 'pawn',
                color: 'black',
                deplace: ['c6', 'c5'],
                capture: [],
                moved: false
            },
            d7: {
                name: 'pawn',
                color: 'black',
                deplace: ['d6', 'd5'],
                capture: [],
                moved: false
            },
            e7: {
                name: 'pawn',
                color: 'black',
                deplace: ['e6', 'e5'],
                capture: [],
                moved: false
            },
            f7: {
                name: 'pawn',
                color: 'black',
                deplace: ['f6', 'f5'],
                capture: [],
                moved: false
            },
            g7: {
                name: 'pawn',
                color: 'black',
                deplace: ['g6', 'g5'],
                capture: [],
                moved: false
            },
            h7: {
                name: 'pawn',
                color: 'black',
                deplace: ['h6', 'h5'],
                capture: [],
                moved: false
            }
        }
    };

    this.games.data[gid] = game;

    return gid;
};

Game.prototype.timer = function (game) {

    var time = game[game.turn].time,
        timeTurn = game[game.turn].timeTurn;

    if (time > 0 && timeTurn > 0) {
        game[game.turn].time--;
        game[game.turn].timeTurn--;
    } else {
        var color = game.turn === 'white' ? 'black' : 'white';
        game.finish = true;
        game.result.winner = game[color].nbPieces === 1 ? 0 : (color === 'white' ? 1 : 2);
        game.result.name = game.result.winner === 0 ? 'draw' : 'time';
        return game;
    }

    return false;
};
