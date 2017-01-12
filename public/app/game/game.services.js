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
    king: 30000
}).

service('evaluation', ['tablesEvaluation', 'piecesValues', function(tables, piecesValues) {

    var game = JSON.parse('{"id":1,"startTime":1484127719147,"time":300,"timeTurn":120,"timestamp":83,"finish":false,"turn":"black","turn50":0,"maxOfferDraw":3,"played":[{"time":1484127722591,"hash":"1810637654","start":"f2","end":"f4","notation":"f2 f4"},{"time":1484127724206,"hash":"406768468","start":"e7","end":"e5","notation":"e7 e5"},{"time":1484127726983,"hash":"-769315435","start":"f4","end":"e5","notation":"f4xe5"},{"time":1484127728770,"hash":"-1440509094","start":"b8","end":"c6","notation":"b8 c6"},{"time":1484127731107,"hash":"-1008005649","start":"b1","end":"c3","notation":"b1 c3"},{"time":1484127733131,"hash":"-399928786","start":"g7","end":"g6","notation":"g7 g6"},{"time":1484127735954,"hash":"1630418045","start":"g1","end":"f3","notation":"g1 f3"},{"time":1484127737347,"hash":"623495356","start":"d7","end":"d6","notation":"d7 d6"},{"time":1484127739699,"hash":"-784715395","start":"a2","end":"a3","notation":"a2 a3"},{"time":1484127742362,"hash":"1334567560","start":"d6","end":"e5","notation":"d6xe5"},{"time":1484127744380,"hash":"-478097686","start":"f3","end":"e5","notation":"f3xe5"},{"time":1484127746873,"hash":"-834679393","start":"c6","end":"e5","notation":"c6xe5"},{"time":1484127750034,"hash":"851220542","start":"e2","end":"e3","notation":"e2 e3"},{"time":1484127754906,"hash":"-1905961046","start":"c8","end":"g4","notation":"c8 g4"},{"time":1484127758136,"hash":"-510787183","start":"d1","end":"g4","notation":"d1xg4"}],"result":{},"white":{"uid":"587410c15fdd153368b76c44","name":"David Mendes","avatar":"https://scontent.xx.fbcdn.net/v/t1.0-1/c15.0.50.50/p50x50/10354686_10150004…6_220367501106153455_n.jpg?oh=978df650af5b925f321fe4050af2869f&oe=5911542F","points":1491,"ranking":4,"time":279,"timeTurn":120,"possibleDraw":false,"king":{"position":"e1","moveForbidden":[]},"nbPieces":14,"offerDraw":0,"lostPieces":{"pawn":1,"bishop":0,"knight":1,"rook":0,"queen":0},"color":"white"},"black":{"uid":"587410c05fdd153368b76c43","name":"Julien Simonet","avatar":"https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/14568136_1175331085838431_1693540271083860709_n.jpg?oh=25ccad73d5500bf7c9f7330c5f32d582&oe=59109AFD","points":1509,"ranking":1,"time":238,"timeTurn":76,"possibleDraw":false,"king":{"position":"e8","moveForbidden":[]},"nbPieces":13,"offerDraw":0,"lostPieces":{"pawn":2,"bishop":1,"knight":0,"rook":0,"queen":0},"color":"black"},"pieces":{"e1":{"name":"king","color":"white","deplace":["e2","f2","d1"],"capture":[],"moved":false},"e8":{"name":"king","color":"black","deplace":["e7"],"capture":[],"moved":false},"d8":{"name":"queen","color":"black","deplace":["d7","d6","d5","d4","d3","c8","b8","e7","f6","g5","h4"],"capture":["d2"],"moved":false},"a1":{"name":"rook","color":"white","deplace":["a2","b1"],"capture":[],"moved":false},"h1":{"name":"rook","color":"white","deplace":["g1"],"capture":[],"moved":false},"a8":{"name":"rook","color":"black","deplace":["b8","c8"],"capture":[],"moved":false},"h8":{"name":"rook","color":"black","deplace":[],"capture":[],"moved":false},"c1":{"name":"bishop","color":"white","deplace":[],"capture":[],"moved":false},"f1":{"name":"bishop","color":"white","deplace":["e2","d3","c4","b5","a6"],"capture":[],"moved":false},"f8":{"name":"bishop","color":"black","deplace":["e7","d6","c5","b4","g7","h6"],"capture":["a3"],"moved":false},"g8":{"name":"knight","color":"black","deplace":["e7","h6","f6"],"capture":[],"moved":false},"b2":{"name":"pawn","color":"white","deplace":["b3","b4"],"capture":[],"moved":false},"c2":{"name":"pawn","color":"white","deplace":[],"capture":[],"moved":false},"d2":{"name":"pawn","color":"white","deplace":["d3","d4"],"capture":[],"moved":false},"g2":{"name":"pawn","color":"white","deplace":["g3"],"capture":[],"moved":false},"h2":{"name":"pawn","color":"white","deplace":["h3","h4"],"capture":[],"moved":false},"a7":{"name":"pawn","color":"black","deplace":["a6","a5"],"capture":[],"moved":false},"b7":{"name":"pawn","color":"black","deplace":["b6","b5"],"capture":[],"moved":false},"c7":{"name":"pawn","color":"black","deplace":["c6","c5"],"capture":[],"moved":false},"f7":{"name":"pawn","color":"black","deplace":["f6","f5"],"capture":[],"moved":false},"h7":{"name":"pawn","color":"black","deplace":["h6","h5"],"capture":[],"moved":false},"e5":{"name":"knight","color":"black","deplace":["c4","c6","f3","d3","d7"],"capture":["g4"],"moved":true},"c3":{"name":"knight","color":"white","deplace":["a2","a4","e4","e2","d5","d1","b1","b5"],"capture":[],"moved":true},"g6":{"name":"pawn","color":"black","deplace":["g5"],"capture":[],"moved":true},"a3":{"name":"pawn","color":"white","deplace":["a4"],"capture":[],"moved":true},"e3":{"name":"pawn","color":"white","deplace":["e4"],"capture":[],"moved":true},"g4":{"name":"queen","color":"white","deplace":["g5","h4","g3","f4","e4","d4","c4","b4","a4","h5","f3","e2","d1","h3","f5","e6","d7","c8"],"capture":["g6"],"moved":true}},"notations":[{"white":{"value":"f2 f4","time":null},"black":{"value":"e7 e5","time":1615},"$$hashKey":"object:325"},{"white":{"value":"f4xe5","time":2777},"black":{"value":"b8 c6","time":1787},"$$hashKey":"object:326"},{"white":{"value":"b1 c3","time":2337},"black":{"value":"g7 g6","time":2024},"$$hashKey":"object:327"},{"white":{"value":"g1 f3","time":2823},"black":{"value":"d7 d6","time":1393},"$$hashKey":"object:328"},{"white":{"value":"a2 a3","time":2352},"black":{"value":"d6xe5","time":2663},"$$hashKey":"object:329"},{"white":{"value":"f3xe5","time":2018},"black":{"value":"c6xe5","time":2493},"$$hashKey":"object:330"},{"white":{"value":"e2 e3","time":3161},"black":{"value":"c8 g4","time":4872},"$$hashKey":"object:331"},{"white":{"value":"d1xg4","time":3230},"$$hashKey":"object:332"}]}');
    
    console.log(getScores(game));

    var isEnd, blackBishopCount, whiteBishopCount, whitePawnCount, blackPawnCount;

    function getPieceValue(name) {
        return piecesValues[name];
    }

    function getPosition (position) {
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

        position = getPosition(position); 

        var score = 0;

        if (!piece.defended) {
            piece.defended = 0;
        }

        if (!piece.attacked) {
            piece.attacked = 0;
        }

        score += piece.defended;
        score -= piece.attacked;

        //Double Penalty for Hanging Pieces
        if (piece.defended < piece.attacked) {
            score -= ((piece.attacked - piece.defended) * 10);
        }

        if (piece.move) {
            score += piece.move;
        }

        if (piece.color === 'black') {
            index = 63 - position;
        } else {
            index = position;
        }

        /**
         * Retirez quelques points pour les pions sur le bord de la planche. L'idée est que depuis un pion du bord ne peut attaquer une seule voie, il vaut 15% de moins.
         * Donnez un bonus supplémentaire pour les pions qui sont au 6e et au 7e rang tant qu'ils ne sont pas attaqués de quelque façon que ce soit.
         * Ajouter des points en fonction de la recherche de table carrée Piwn Piece.
         */
        if (piece.name === 'pawn') {
            // Si le pion est sur le bord
            if (position % 8 == 0 || position % 8 == 7) {
                score -= 15;
            }

            // Calculer la valeur sur la board
            score += table.pawn[index];

            if (piece.color === 'white') {
                // Si il y a un pion blanc dans cette colone 
                if (whitePawnCount[position % 8] > 0) {
                    //Doubled Pawn
                    score -= 16;
                }

                if (position >= 8 && position <= 15) {
                    if (piece.attacked) {
                        whitePawnCount[position % 8] += 200;
                        if (!piece.defended) {
                            whitePawnCount[position % 8] += 50;
                        }
                    }
                } else if (position >= 16 && position <= 23) {
                    if (piece.attacked) {
                        whitePawnCount[position % 8] += 100;
                        if (!piece.defended) {
                            whitePawnCount[position % 8] += 25;
                        }
                    }
                }
                whitePawnCount[position % 8] +=10;
            } else {
                if (blackPawnCount[position % 8] > 0) {
                   //Doubled Pawn
                   score -= 16;
                }

                if (position >= 48 && position <= 55) {
                    if (piece.attacked) {
                        blackPawnCount[position % 8] += 200;
                        if (!piece.defended) {
                            blackPawnCount[position % 8] += 50;
                        }
                    }
                } else if (position >= 40 && position <= 47) {
                    if (piece.attacked) {
                        blackPawnCount[position % 8] += 100;
                        if (!piece.defended) {
                            blackPawnCount[position % 8] += 25;
                        }
                    }
                }
                blackPawnCount[position % 8] += 10;
            }
        } else if (piece.name == 'knight') {
            score += table.knight[index];
            if (isEnd) {
                score -= 10;
            }
        } else if (piece.name == 'bishop') {
            if (piece.color === 'white') {
                whiteBishopCount++;
                if (whiteBishopCount >= 2) {
                    score += 10;
                }
            } else {
                blackBishopCount++;
                if (blackBishopCount >= 2) {
                    score += 10;
                }
            }
            if (isEnd) {
                score += 10;
            }
            score += table.bishop[index];
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
                score += table.kingEndGame[index];
            } else {
                score += table.king[index];
                if (piece.moved && !castled) {
                    score -= 30;
                }
            }
        }

        return score;
    }

    function getScores(game) {
        var scores = {
            white: 0,
            black: 0
        };

        isEnd = Object.keys(game.pieces).length < 10;

        if (game.check) {
            var color = game.turn === 'white' ? 'black' : 'white';
            scores[color] += 75;
            if (isEnd) {
                scores[color] += 10;
            }
        }

        if (game.white.castling) {
            scores.white += 40;
            scores.black -= 40;
        }

        if (game.black.castling) {
            scores.black += 40;
            scores.white -= 40;
        }

        scores[game.turn] += 10;

        blackBishopCount = 0;
        whiteBishopCount = 0;
        whitePawnCount = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0
        };
        blackPawnCount = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0
        };

        angular.forEach(game.pieces, function (piece) {
            angular.forEach(pieces.deplace, function (deplace) {
                if (pieces[deplace]) {
                    if (!pieces[deplace].defended) {
                        pieces[deplace].defended = 0;
                    }
                    pieces[deplace].defended += getPieceValue(piece.name);
                }
            });

            angular.forEach(pieces.capture, function (capture) {
                if (pieces[capture]) {
                    if (!pieces[capture].attacked) {
                        pieces[capture].attacked = 0;
                    }
                    pieces[capture].attacked += getPieceValue(piece.name);
                }
            });

            piece.move = piece.deplace.length;

            if (piece.color == 'white') {
                scores.white += evaluatePiece(pieces, i, game.white.castling);
            } else if (piece.color == 'black') {
                scores.black += evaluatePiece(pieces, i, game.black.castling);
            }
        });

        //Black Isolated Pawns
        if (blackPawnCount[0] >= 1 && blackPawnCount[1] == 0) {
            scores.white += 12;
        }

        if (blackPawnCount[1] >= 1 && blackPawnCount[0] == 0 && blackPawnCount[2] == 0) {
            scores.white += 14;
        }

        if (blackPawnCount[2] >= 1 && blackPawnCount[1] == 0 && blackPawnCount[3] == 0) {
            scores.white += 16;
        }

        if (blackPawnCount[3] >= 1 && blackPawnCount[2] == 0 && blackPawnCount[4] == 0) {
            scores.white += 20;
        }

        if (blackPawnCount[4] >= 1 && blackPawnCount[3] == 0 && blackPawnCount[5] == 0) {
            scores.white += 20;
        }
        if (blackPawnCount[5] >= 1 && blackPawnCount[4] == 0 && blackPawnCount[6] == 0) {
            scores.white += 16;
        }

        if (blackPawnCount[6] >= 1 && blackPawnCount[5] == 0 && blackPawnCount[7] == 0) {
            scores.white += 14;
        }

        if (blackPawnCount[7] >= 1 && blackPawnCount[6] == 0) {
            scores.white += 12;
        }

        //White Isolated Pawns
        if (whitePawnCount[0] >= 1 && whitePawnCount[1] == 0) {
            scores.black += 12;
        }

        if (whitePawnCount[1] >= 1 && whitePawnCount[0] == 0 && whitePawnCount[2] == 0) {
            scores.black += 14;
        }

        if (whitePawnCount[2] >= 1 && whitePawnCount[1] == 0 && whitePawnCount[3] == 0) {
            scores.black += 16;
        }

        if (whitePawnCount[3] >= 1 && whitePawnCount[2] == 0 && whitePawnCount[4] == 0) {
            scores.black += 20;
        }

        if (whitePawnCount[4] >= 1 && whitePawnCount[3] == 0 && whitePawnCount[5] == 0) {
            scores.black += 20;
        }
        if (whitePawnCount[5] >= 1 && whitePawnCount[4] == 0 && whitePawnCount[6] == 0) {
            scores.black += 16;
        }

        if (whitePawnCount[6] >= 1 && whitePawnCount[5] == 0 && whitePawnCount[7] == 0) {
            scores.black += 14;
        }

        if (whitePawnCount[7] >= 1 && whitePawnCount[6] == 0) {
            scores.black += 12;
        }


        //Black Passed Pawns
        if (blackPawnCount[0] >= 1 && whitePawnCount[0] == 0) {
            scores.black += blackPawnCount[0];
        }

        if (blackPawnCount[1] >= 1 && whitePawnCount[1] == 0) {
            scores.black += blackPawnCount[1];
        }

        if (blackPawnCount[2] >= 1 && whitePawnCount[2] == 0) {
            scores.black += blackPawnCount[2];
        }

        if (blackPawnCount[3] >= 1 && whitePawnCount[3] == 0) {
            scores.black += blackPawnCount[3];
        }

        if (blackPawnCount[4] >= 1 && whitePawnCount[4] == 0) {
            scores.black += blackPawnCount[4];
        }

        if (blackPawnCount[5] >= 1 && whitePawnCount[5] == 0) {
            scores.black += blackPawnCount[5];
        }

        if (blackPawnCount[6] >= 1 && whitePawnCount[6] == 0) {
            scores.black += blackPawnCount[6];
        }

        if (blackPawnCount[7] >= 1 && whitePawnCount[7] == 0) {
            scores.black += blackPawnCount[7];
        }

        //White Passed Pawns
        if (whitePawnCount[0] >= 1 && blackPawnCount[1] == 0) {
            scores.white += whitePawnCount[0];
        }

        if (whitePawnCount[1] >= 1 && blackPawnCount[1] == 0) {
            scores.white += whitePawnCount[1];
        }

        if (whitePawnCount[2] >= 1 && blackPawnCount[2] == 0) {
            scores.white += whitePawnCount[2];
        }

        if (whitePawnCount[3] >= 1 && blackPawnCount[3] == 0) {
            scores.white += whitePawnCount[3];
        }

        if (whitePawnCount[4] >= 1 && blackPawnCount[4] == 0) {
            scores.white += whitePawnCount[4];
        }

        if (whitePawnCount[5] >= 1 && blackPawnCount[5] == 0) {
            scores.white += whitePawnCount[5];
        }

        if (whitePawnCount[6] >= 1 && blackPawnCount[6] == 0) {
            scores.white += whitePawnCount[6];
        }

        if (whitePawnCount[7] >= 1 && blackPawnCount[7] == 0) {
            scores.white += whitePawnCount[7];
        }

        return scores;
    }
}]);

var tables = {
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
};

var piecesValues = {
    pawn: 100,
    knight: 300,
    bishop: 300,
    rook: 500,
    queen: 900,
    king: 30000
};

var game = JSON.parse('{"id":1,"startTime":1484127719147,"time":300,"timeTurn":120,"timestamp":83,"finish":false,"turn":"black","turn50":0,"maxOfferDraw":3,"played":[{"time":1484127722591,"hash":"1810637654","start":"f2","end":"f4","notation":"f2 f4"},{"time":1484127724206,"hash":"406768468","start":"e7","end":"e5","notation":"e7 e5"},{"time":1484127726983,"hash":"-769315435","start":"f4","end":"e5","notation":"f4xe5"},{"time":1484127728770,"hash":"-1440509094","start":"b8","end":"c6","notation":"b8 c6"},{"time":1484127731107,"hash":"-1008005649","start":"b1","end":"c3","notation":"b1 c3"},{"time":1484127733131,"hash":"-399928786","start":"g7","end":"g6","notation":"g7 g6"},{"time":1484127735954,"hash":"1630418045","start":"g1","end":"f3","notation":"g1 f3"},{"time":1484127737347,"hash":"623495356","start":"d7","end":"d6","notation":"d7 d6"},{"time":1484127739699,"hash":"-784715395","start":"a2","end":"a3","notation":"a2 a3"},{"time":1484127742362,"hash":"1334567560","start":"d6","end":"e5","notation":"d6xe5"},{"time":1484127744380,"hash":"-478097686","start":"f3","end":"e5","notation":"f3xe5"},{"time":1484127746873,"hash":"-834679393","start":"c6","end":"e5","notation":"c6xe5"},{"time":1484127750034,"hash":"851220542","start":"e2","end":"e3","notation":"e2 e3"},{"time":1484127754906,"hash":"-1905961046","start":"c8","end":"g4","notation":"c8 g4"},{"time":1484127758136,"hash":"-510787183","start":"d1","end":"g4","notation":"d1xg4"}],"result":{},"white":{"uid":"587410c15fdd153368b76c44","name":"David Mendes","avatar":"https://scontent.xx.fbcdn.net/v/t1.0-1/c15.0.50.50/p50x50/10354686_10150004…6_220367501106153455_n.jpg?oh=978df650af5b925f321fe4050af2869f&oe=5911542F","points":1491,"ranking":4,"time":279,"timeTurn":120,"possibleDraw":false,"king":{"position":"e1","moveForbidden":[]},"nbPieces":14,"offerDraw":0,"lostPieces":{"pawn":1,"bishop":0,"knight":1,"rook":0,"queen":0},"color":"white"},"black":{"uid":"587410c05fdd153368b76c43","name":"Julien Simonet","avatar":"https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/14568136_1175331085838431_1693540271083860709_n.jpg?oh=25ccad73d5500bf7c9f7330c5f32d582&oe=59109AFD","points":1509,"ranking":1,"time":238,"timeTurn":76,"possibleDraw":false,"king":{"position":"e8","moveForbidden":[]},"nbPieces":13,"offerDraw":0,"lostPieces":{"pawn":2,"bishop":1,"knight":0,"rook":0,"queen":0},"color":"black"},"pieces":{"e1":{"name":"king","color":"white","deplace":["e2","f2","d1"],"capture":[],"moved":false},"e8":{"name":"king","color":"black","deplace":["e7"],"capture":[],"moved":false},"d8":{"name":"queen","color":"black","deplace":["d7","d6","d5","d4","d3","c8","b8","e7","f6","g5","h4"],"capture":["d2"],"moved":false},"a1":{"name":"rook","color":"white","deplace":["a2","b1"],"capture":[],"moved":false},"h1":{"name":"rook","color":"white","deplace":["g1"],"capture":[],"moved":false},"a8":{"name":"rook","color":"black","deplace":["b8","c8"],"capture":[],"moved":false},"h8":{"name":"rook","color":"black","deplace":[],"capture":[],"moved":false},"c1":{"name":"bishop","color":"white","deplace":[],"capture":[],"moved":false},"f1":{"name":"bishop","color":"white","deplace":["e2","d3","c4","b5","a6"],"capture":[],"moved":false},"f8":{"name":"bishop","color":"black","deplace":["e7","d6","c5","b4","g7","h6"],"capture":["a3"],"moved":false},"g8":{"name":"knight","color":"black","deplace":["e7","h6","f6"],"capture":[],"moved":false},"b2":{"name":"pawn","color":"white","deplace":["b3","b4"],"capture":[],"moved":false},"c2":{"name":"pawn","color":"white","deplace":[],"capture":[],"moved":false},"d2":{"name":"pawn","color":"white","deplace":["d3","d4"],"capture":[],"moved":false},"g2":{"name":"pawn","color":"white","deplace":["g3"],"capture":[],"moved":false},"h2":{"name":"pawn","color":"white","deplace":["h3","h4"],"capture":[],"moved":false},"a7":{"name":"pawn","color":"black","deplace":["a6","a5"],"capture":[],"moved":false},"b7":{"name":"pawn","color":"black","deplace":["b6","b5"],"capture":[],"moved":false},"c7":{"name":"pawn","color":"black","deplace":["c6","c5"],"capture":[],"moved":false},"f7":{"name":"pawn","color":"black","deplace":["f6","f5"],"capture":[],"moved":false},"h7":{"name":"pawn","color":"black","deplace":["h6","h5"],"capture":[],"moved":false},"e5":{"name":"knight","color":"black","deplace":["c4","c6","f3","d3","d7"],"capture":["g4"],"moved":true},"c3":{"name":"knight","color":"white","deplace":["a2","a4","e4","e2","d5","d1","b1","b5"],"capture":[],"moved":true},"g6":{"name":"pawn","color":"black","deplace":["g5"],"capture":[],"moved":true},"a3":{"name":"pawn","color":"white","deplace":["a4"],"capture":[],"moved":true},"e3":{"name":"pawn","color":"white","deplace":["e4"],"capture":[],"moved":true},"g4":{"name":"queen","color":"white","deplace":["g5","h4","g3","f4","e4","d4","c4","b4","a4","h5","f3","e2","d1","h3","f5","e6","d7","c8"],"capture":["g6"],"moved":true}},"notations":[{"white":{"value":"f2 f4","time":null},"black":{"value":"e7 e5","time":1615},"$$hashKey":"object:325"},{"white":{"value":"f4xe5","time":2777},"black":{"value":"b8 c6","time":1787},"$$hashKey":"object:326"},{"white":{"value":"b1 c3","time":2337},"black":{"value":"g7 g6","time":2024},"$$hashKey":"object:327"},{"white":{"value":"g1 f3","time":2823},"black":{"value":"d7 d6","time":1393},"$$hashKey":"object:328"},{"white":{"value":"a2 a3","time":2352},"black":{"value":"d6xe5","time":2663},"$$hashKey":"object:329"},{"white":{"value":"f3xe5","time":2018},"black":{"value":"c6xe5","time":2493},"$$hashKey":"object:330"},{"white":{"value":"e2 e3","time":3161},"black":{"value":"c8 g4","time":4872},"$$hashKey":"object:331"},{"white":{"value":"d1xg4","time":3230},"$$hashKey":"object:332"}]}');
    
    console.log(getScores(game));

    var isEnd, blackBishopCount, whiteBishopCount, whitePawnCount, blackPawnCount;

    function getPieceValue(name) {
        return piecesValues[name];
    }

    function getPosition (position) {
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

        position = getPosition(position); 

        var score = 0;

        if (!piece.defended) {
            piece.defended = 0;
        }

        if (!piece.attacked) {
            piece.attacked = 0;
        }

        score += piece.defended;
        score -= piece.attacked;

        console.log(score)

        //Double Penalty for Hanging Pieces
        if (piece.defended < piece.attacked) {
            score -= ((piece.attacked - piece.defended) * 10);
        }

        if (piece.move) {
            score += piece.move;
        }

        var index = piece.color === 'black' ? 63 - position : position;

        /**
         * Retirez quelques points pour les pions sur le bord de la planche. L'idée est que depuis un pion du bord ne peut attaquer une seule voie, il vaut 15% de moins.
         * Donnez un bonus supplémentaire pour les pions qui sont au 6e et au 7e rang tant qu'ils ne sont pas attaqués de quelque façon que ce soit.
         * Ajouter des points en fonction de la recherche de table carrée Piwn Piece.
         */
        if (piece.name === 'pawn') {
            // Si le pion est sur le bord
            if (position % 8 == 0 || position % 8 == 7) {
                score -= 15;
            }

            // Calculer la valeur sur la board
            score += tables.pawn[index];

            if (piece.color === 'white') {
                // Si il y a un pion blanc dans cette colone 
                if (whitePawnCount[position % 8] > 0) {
                    //Doubled Pawn
                    score -= 16;
                }

                if (position >= 8 && position <= 15) {
                    if (piece.attacked) {
                        whitePawnCount[position % 8] += 200;
                        if (!piece.defended) {
                            whitePawnCount[position % 8] += 50;
                        }
                    }
                } else if (position >= 16 && position <= 23) {
                    if (piece.attacked) {
                        whitePawnCount[position % 8] += 100;
                        if (!piece.defended) {
                            whitePawnCount[position % 8] += 25;
                        }
                    }
                }
                whitePawnCount[position % 8] +=10;
            } else {
                if (blackPawnCount[position % 8] > 0) {
                   //Doubled Pawn
                   score -= 16;
                }

                if (position >= 48 && position <= 55) {
                    if (piece.attacked) {
                        blackPawnCount[position % 8] += 200;
                        if (!piece.defended) {
                            blackPawnCount[position % 8] += 50;
                        }
                    }
                } else if (position >= 40 && position <= 47) {
                    if (piece.attacked) {
                        blackPawnCount[position % 8] += 100;
                        if (!piece.defended) {
                            blackPawnCount[position % 8] += 25;
                        }
                    }
                }
                blackPawnCount[position % 8] += 10;
            }
        } else if (piece.name == 'knight') {
            score += tables.knight[index];
            if (isEnd) {
                score -= 10;
            }
        } else if (piece.name == 'bishop') {
            if (piece.color === 'white') {
                whiteBishopCount++;
                if (whiteBishopCount >= 2) {
                    score += 10;
                }
            } else {
                blackBishopCount++;
                if (blackBishopCount >= 2) {
                    score += 10;
                }
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

    function getScores(game) {
        var scores = {
            white: 0,
            black: 0
        };

        isEnd = Object.keys(game.pieces).length < 10;

        if (game.check) {
            var color = game.turn === 'white' ? 'black' : 'white';
            scores[color] += 75;
            if (isEnd) {
                scores[color] += 10;
            }
        }

        if (game.white.castling) {
            scores.white += 40;
            scores.black -= 40;
        }

        if (game.black.castling) {
            scores.black += 40;
            scores.white -= 40;
        }

        scores[game.turn] += 10;

        blackBishopCount = 0;
        whiteBishopCount = 0;
        whitePawnCount = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0
        };
        blackPawnCount = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0
        };

        var pieces = game.pieces;

        angular.forEach(pieces, function (piece, position) {
            angular.forEach(piece.deplace, function (deplace) {
                if (pieces[deplace]) {
                    if (!pieces[deplace].defended) {
                        pieces[deplace].defended = 0;
                    }
                    pieces[deplace].defended += getPieceValue(piece.name);
                }
            });

            angular.forEach(piece.capture, function (capture) {
                if (pieces[capture]) {
                    if (!pieces[capture].attacked) {
                        pieces[capture].attacked = 0;
                    }
                    pieces[capture].attacked += getPieceValue(piece.name);
                }
            });

            piece.move = piece.deplace.length;

            if (piece.color == 'white') {
                scores.white += evaluatePiece(piece, position, game.white.castling);
            } else if (piece.color == 'black') {
                scores.black += evaluatePiece(piece, position, game.black.castling);
            }
        });

        //Black Isolated Pawns
        if (blackPawnCount[0] >= 1 && blackPawnCount[1] == 0) {
            scores.white += 12;
        }

        if (blackPawnCount[1] >= 1 && blackPawnCount[0] == 0 && blackPawnCount[2] == 0) {
            scores.white += 14;
        }

        if (blackPawnCount[2] >= 1 && blackPawnCount[1] == 0 && blackPawnCount[3] == 0) {
            scores.white += 16;
        }

        if (blackPawnCount[3] >= 1 && blackPawnCount[2] == 0 && blackPawnCount[4] == 0) {
            scores.white += 20;
        }

        if (blackPawnCount[4] >= 1 && blackPawnCount[3] == 0 && blackPawnCount[5] == 0) {
            scores.white += 20;
        }
        if (blackPawnCount[5] >= 1 && blackPawnCount[4] == 0 && blackPawnCount[6] == 0) {
            scores.white += 16;
        }

        if (blackPawnCount[6] >= 1 && blackPawnCount[5] == 0 && blackPawnCount[7] == 0) {
            scores.white += 14;
        }

        if (blackPawnCount[7] >= 1 && blackPawnCount[6] == 0) {
            scores.white += 12;
        }

        //White Isolated Pawns
        if (whitePawnCount[0] >= 1 && whitePawnCount[1] == 0) {
            scores.black += 12;
        }

        if (whitePawnCount[1] >= 1 && whitePawnCount[0] == 0 && whitePawnCount[2] == 0) {
            scores.black += 14;
        }

        if (whitePawnCount[2] >= 1 && whitePawnCount[1] == 0 && whitePawnCount[3] == 0) {
            scores.black += 16;
        }

        if (whitePawnCount[3] >= 1 && whitePawnCount[2] == 0 && whitePawnCount[4] == 0) {
            scores.black += 20;
        }

        if (whitePawnCount[4] >= 1 && whitePawnCount[3] == 0 && whitePawnCount[5] == 0) {
            scores.black += 20;
        }
        if (whitePawnCount[5] >= 1 && whitePawnCount[4] == 0 && whitePawnCount[6] == 0) {
            scores.black += 16;
        }

        if (whitePawnCount[6] >= 1 && whitePawnCount[5] == 0 && whitePawnCount[7] == 0) {
            scores.black += 14;
        }

        if (whitePawnCount[7] >= 1 && whitePawnCount[6] == 0) {
            scores.black += 12;
        }


        //Black Passed Pawns
        if (blackPawnCount[0] >= 1 && whitePawnCount[0] == 0) {
            scores.black += blackPawnCount[0];
        }

        if (blackPawnCount[1] >= 1 && whitePawnCount[1] == 0) {
            scores.black += blackPawnCount[1];
        }

        if (blackPawnCount[2] >= 1 && whitePawnCount[2] == 0) {
            scores.black += blackPawnCount[2];
        }

        if (blackPawnCount[3] >= 1 && whitePawnCount[3] == 0) {
            scores.black += blackPawnCount[3];
        }

        if (blackPawnCount[4] >= 1 && whitePawnCount[4] == 0) {
            scores.black += blackPawnCount[4];
        }

        if (blackPawnCount[5] >= 1 && whitePawnCount[5] == 0) {
            scores.black += blackPawnCount[5];
        }

        if (blackPawnCount[6] >= 1 && whitePawnCount[6] == 0) {
            scores.black += blackPawnCount[6];
        }

        if (blackPawnCount[7] >= 1 && whitePawnCount[7] == 0) {
            scores.black += blackPawnCount[7];
        }

        //White Passed Pawns
        if (whitePawnCount[0] >= 1 && blackPawnCount[1] == 0) {
            scores.white += whitePawnCount[0];
        }

        if (whitePawnCount[1] >= 1 && blackPawnCount[1] == 0) {
            scores.white += whitePawnCount[1];
        }

        if (whitePawnCount[2] >= 1 && blackPawnCount[2] == 0) {
            scores.white += whitePawnCount[2];
        }

        if (whitePawnCount[3] >= 1 && blackPawnCount[3] == 0) {
            scores.white += whitePawnCount[3];
        }

        if (whitePawnCount[4] >= 1 && blackPawnCount[4] == 0) {
            scores.white += whitePawnCount[4];
        }

        if (whitePawnCount[5] >= 1 && blackPawnCount[5] == 0) {
            scores.white += whitePawnCount[5];
        }

        if (whitePawnCount[6] >= 1 && blackPawnCount[6] == 0) {
            scores.white += whitePawnCount[6];
        }

        if (whitePawnCount[7] >= 1 && blackPawnCount[7] == 0) {
            scores.white += whitePawnCount[7];
        }

        return scores;
    }
