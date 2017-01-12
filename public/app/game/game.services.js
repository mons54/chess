'use strict';

angular.module('game').

constant('tablesEvaluation', {
    pawn: [
        0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 27, 27, 10,  5,  5,
        0,  0,  0, 25, 25,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-25,-25, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
    ],
    knight: [
        -50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -50,-40,-20,-30,-30,-20,-40,-50,
    ],
    bishop: [
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -20,-10,-40,-10,-10,-40,-10,-20,
    ],
    king: [
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10, 
        20,  20,   0,   0,   0,   0,  20,  20,
        20,  30,  10,   0,   0,  10,  30,  20
    ],
    kingEndGame: [
        -50,-40,-30,-20,-20,-30,-40,-50,
        -30,-20,-10,  0,  0,-10,-20,-30,
        -30,-10, 20, 30, 30, 20,-10,-30,
        -30,-10, 30, 40, 40, 30,-10,-30,
        -30,-10, 30, 40, 40, 30,-10,-30,
        -30,-10, 20, 30, 30, 20,-10,-30,
        -30,-30,  0,  0,  0,  0,-30,-30,
        -50,-30,-30,-30,-30,-30,-30,-50
    ]
}).

constant('piecesValues', {
    pawn: 100,
    knight: 300,
    bishop: 300,
    rook: 500,
    queen: 900,
    king: 1000
}).

service('evaluation', ['tablesEvaluation', 'piecesValues', function(tables, piecesValues) {

    var isEnd, bishopCount, pawnCount;

    function getPieceValue(name) {
        return piecesValues[name];
    }

    function getPosition(position) {
        var value = 0;
        switch(position.substr(0, 1)) {
            case 'b': value += 1; break;
            case 'c': value += 2; break;
            case 'd': value += 3; break;
            case 'e': value += 4; break;
            case 'f': value += 5; break;
            case 'g': value += 6; break;
            case 'h': value += 7; break;
        }

        switch(position.substr(1, 1)) {
            case '2': value += 8; break;
            case '3': value += 16; break;
            case '4': value += 24; break;
            case '5': value += 32; break;
            case '6': value += 40; break;
            case '7': value += 48; break;
            case '8': value += 56; break;
        }

        return value;
    }

    function evaluatePiece(piece, position, castled) {

        console.log(piece)

        var score = getPieceValue(piece.name);

        if (!piece.defended) {
            piece.defended = 0;
        }

        if (!piece.attacked) {
            piece.attacked = 0;
        }

        score += piece.defended;
        score -= piece.attacked;

        score += piece.deplace.length;

        var index = piece.color === 'black' ? 63 - position : position;

        if (piece.name === 'pawn') {

            if (position % 8 == 0 || position % 8 == 7) {
                score -= 15;
            }

            if (pawnCount[piece.color][position % 8] > 0) {
                score -= 16;
            }

            score += tables.pawn[index];
        } else if (piece.name == 'knight') {
            score += tables.knight[index];
            if (isEnd) {
                score -= 10;
            }
        } else if (piece.name == 'bishop') {
            bishopCount++;
            if (bishopCount >= 2) {
                score += 10;
            }
            if (isEnd) {
                score += 10;
            }
            score += tables.bishop[index];
        } else if (piece.name == 'rook') {
            if (piece.moved && !castled) {
                score -= 10;
            }
        } else if (piece.name == 'queen') {
            if (piece.moved && !isEnd) {
                score -= 10;
            }
        } else if (piece.name == 'king') {
            if (piece.move < 2) {
                score -= 5;
            } 
            if (isEnd) {
                score += tables.kingEndGame[index];
            } else {
                score += tables.king[index];
                if (piece.moved && !castled) {
                    score -= 30;
                }
            }
        }

        return score;
    }

    function isPromotion(piece, position) {
        return piece.name === 'pawn' && (position.substr(-1) === '1' || position.substr(-1) === '8');
    }

    function getDefended(game, position) {
        var pieces = game.pieces,
            defended = 0;

        angular.forEach(pieces, function (piece) {

            angular.forEach(piece.capture, function (capture) {
                if (pieces[capture] && pieces[capture].capture.indexOf(position)) {
                    defended = getPieceValue(pieces[capture].name);
                }
            });
        });

        return defended;
    }

    function getScore(game) {

        var score = 0,
            opponent = game.turn === 'white' ? 'black' : 'white';

        console.log(game.pieces)

        isEnd = Object.keys(game.pieces).length < 10;

        if (game.check) {
            score -= 75;
            if (isEnd) {
                score -= 10;
            }
        }

        if (game[game.turn].castling) {
            score += 40;
        }

        if (game[opponent].castling) {
            score -= 40;
        }

        bishopCount = 0;

        pawnCount = {
            white: {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0,
                7: 0
            },
            black: {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0,
                7: 0
            }
        };

        var pieces = game.pieces;

        angular.forEach(pieces, function (piece, position) {

            angular.forEach(piece.capture, function (capture) {
                if ((piece.color !== game.turn && piece.name !== 'pawn') ||
                    !pieces[capture]) {
                    return;
                }
                if (!pieces[capture].attacked) {
                    pieces[capture].attacked = 0;
                }

                if (!pieces[capture].defended) {
                    pieces[capture].defended = 0;
                }
                pieces[capture].attacked += 1000 - getPieceValue(pieces[capture].name);
                pieces[capture].defended += 1000 - getDefended(new window.chess.engine(angular.copy(game), position, capture, isPromotion(piece, position)), position);
            });

            var position = getPosition(position),
                index = piece.color === 'black' ? 63 - position : position;


            if (piece.name === 'pawn') {
                if (index >= 8 && index <= 15) {
                    if (!piece.attacked) {
                        pawnCount[piece.color][index % 8] += 200;
                        if (piece.defended) {
                            pawnCount[piece.color][index % 8] += 50;
                        }
                    } 
                } else if (index >= 16 && index <= 23) {
                    if (!piece.attacked) {
                        pawnCount[piece.color][index % 8] += 100;
                        if (piece.defended) {
                            pawnCount[piece.color][index % 8] += 25;
                        }
                    }
                }
                pawnCount[piece.color][index % 8] +=10;
            }
        });

        angular.forEach(pieces, function (piece, position) {
            if (piece.color !== game.turn) {
                return;
            }

            score += evaluatePiece(piece, getPosition(position), game.white.castling);
        });

        if (pawnCount[opponent][0] && !pawnCount[opponent][1]) {
            score += 12;
        }

        if (pawnCount[opponent][1]  && !pawnCount[opponent][0] && !pawnCount[opponent][2]) {
            score += 14;
        }

        if (pawnCount[opponent][2] && !pawnCount[opponent][1] && !pawnCount[opponent][3]) {
            score += 16;
        }

        if (pawnCount[opponent][3] && !pawnCount[opponent][2] && !pawnCount[opponent][4]) {
            score += 20;
        }

        if (pawnCount[opponent][4] && !pawnCount[opponent][3] && !pawnCount[opponent][5]) {
            score += 20;
        }
        if (pawnCount[opponent][5] && !pawnCount[opponent][4] && !pawnCount[opponent][6]) {
            score += 16;
        }

        if (pawnCount[opponent][6] && !pawnCount[opponent][5] && !pawnCount[opponent][7]) {
            score += 14;
        }

        if (pawnCount[opponent][7] && !pawnCount[opponent][6]) {
            score += 12;
        }

        if (pawnCount[game.turn][0] && !pawnCount[game.turn][1] == 0) {
            score -= 12;
        }

        if (pawnCount[game.turn][1] && !pawnCount[game.turn][0] && !pawnCount[game.turn][2] == 0) {
            score -= 14;
        }

        if (pawnCount[game.turn][2] && !pawnCount[game.turn][1] && !pawnCount[game.turn][3] == 0) {
            score -= 16;
        }

        if (pawnCount[game.turn][3] && !pawnCount[game.turn][2] && !pawnCount[game.turn][4]) {
            score -= 20;
        }

        if (pawnCount[game.turn][4] && !pawnCount[game.turn][3] && !pawnCount[game.turn][5]) {
            score -= 20;
        }
        if (pawnCount[game.turn][5] && !pawnCount[game.turn][4] && !pawnCount[game.turn][6]) {
            score -= 16;
        }

        if (pawnCount[game.turn][6] && !pawnCount[game.turn][5] && !pawnCount[game.turn][7]) {
            score -= 14;
        }

        if (pawnCount[game.turn][7] && !pawnCount[game.turn][6]) {
            score -= 12;
        }


        if (pawnCount[opponent][0] && pawnCount[game.turn][0] == 0) {
            score -= pawnCount[opponent][0];
        }

        if (pawnCount[opponent][1] && pawnCount[game.turn][1] == 0) {
            score -= pawnCount[opponent][1];
        }

        if (pawnCount[opponent][2] && pawnCount[game.turn][2] == 0) {
            score -= pawnCount[opponent][2];
        }

        if (pawnCount[opponent][3] && pawnCount[game.turn][3] == 0) {
            score -= pawnCount[opponent][3];
        }

        if (pawnCount[opponent][4] && pawnCount[game.turn][4] == 0) {
            score -= pawnCount[opponent][4];
        }

        if (pawnCount[opponent][5] && pawnCount[game.turn][5] == 0) {
            score -= pawnCount[opponent][5];
        }

        if (pawnCount[opponent][6] && pawnCount[game.turn][6] == 0) {
            score -= pawnCount[opponent][6];
        }

        if (pawnCount[opponent][7] && pawnCount[game.turn][7] == 0) {
            score -= pawnCount[opponent][7];
        }

        if (pawnCount[game.turn][0] && pawnCount[opponent][1] == 0) {
            score += pawnCount[game.turn][0];
        }

        if (pawnCount[game.turn][1] && pawnCount[opponent][1] == 0) {
            score += pawnCount[game.turn][1];
        }

        if (pawnCount[game.turn][2] && pawnCount[opponent][2] == 0) {
            score += pawnCount[game.turn][2];
        }

        if (pawnCount[game.turn][3] && pawnCount[opponent][3] == 0) {
            score += pawnCount[game.turn][3];
        }

        if (pawnCount[game.turn][4] && pawnCount[opponent][4] == 0) {
            score += pawnCount[game.turn][4];
        }

        if (pawnCount[game.turn][5] && pawnCount[opponent][5] == 0) {
            score += pawnCount[game.turn][5];
        }

        if (pawnCount[game.turn][6] && pawnCount[opponent][6] == 0) {
            score += pawnCount[game.turn][6];
        }

        if (pawnCount[game.turn][7] && pawnCount[opponent][7] == 0) {
            score += pawnCount[game.turn][7];
        }

        return score;
    }

    return {
        getScore: getScore
    };
}]);
