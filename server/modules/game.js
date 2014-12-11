module.exports = function () {

    var Engine = require(dirname + '/server/modules/game/engine');

    this.options = {
        colors: ['white', 'black'],
        times: [300, 600, 1200, 3600, 5400],
        pointsMin: [1300, 1400, 1500, 1600, 1700, 1800],
        pointsMax: [1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500]
    };
    
    this.createdGame = {};

    this.games = {
        id: 1,
        data: {}
    };

    this.create = function (socket, data) {
        
        var color = data.color, 
            time = parseInt(data.time), 
            pointsMin = parseInt(data.pointsMin) ? data.pointsMin : false,
            pointsMax = parseInt(data.pointsMax) ? data.pointsMax : false;

        console.log(color, time, pointsMin, pointsMax);

        if (!this.checkColor(color) || !this.checkTime(time) || !this.checkPoints(pointsMin, pointsMax)) {
            return false;
        }

        this.createdGame[socket.uid] = {
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

    this.checkColor = function (color) {
        if (this.options.colors.indexOf(color) === -1) {
            return false;
        }
        return true;
    };

    this.checkTime = function (time) {
        if (this.options.times.indexOf(time) === -1) {
            return false;
        }
        return true;
    };

    this.checkPoints = function (pointsMin, pointsMax) {
        if (!pointsMin || !pointsMax) {
            return true;
        }

        if (this.options.pointsMin.indexOf(pointsMin) === -1 || this.options.pointsMin.indexOf(pointsMax) === -1) {
            return false;
        }

        return pointsMin < pointsMax;
    };

    this.move = function (id, start, end, promotion) {
        
        // ajouter une vérif si c'est au joueur de jouer (voir si son temps est dépassé)

        var game = this.games[id];

        if (!game || game.finish) {
            return;
        }

        return new Engine(game, start, end, promotion);
    };

    this.start = function (white, black, time) {

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
            saved: {},
            white: {
                uid: white.uid,
                name: white.name,
                time: time,
                timeTurn: timeTurn,
                canDraw: false,
                king: {
                    position: 'e1',
                    moveForbidden: []
                },
                nbPieces: nbPieces
            },
            black: {
                uid: black.uid,
                name: black.name,
                time: time,
                timeTurn: timeTurn,
                canDraw: false,
                king: {
                    position: 'e8',
                    moveForbidden: []
                },
                nbPieces: nbPieces
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

        return this.games[gid] = game;
    };

    return this;
};
