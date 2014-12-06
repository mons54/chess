module.exports = function () {
    
    this.createdGame = {
        count: 0,
        data: {}
    };

    this.games = {
        id: 1,
        data: {}
    };

    var Engine = require(dirname + '/server/modules/game/engine');

    this.move = function (id, start, end, promotion) {
        
        // ajouter une vérif si c'est au joueur de jouer (voir si son temps est dépassé)

        var game = this.games[id];

        if (!game || game.finish) {
            return;
        }

        return new Engine(game, start, end, promotion);
    };

    this.create = function (white, black, time) {

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
