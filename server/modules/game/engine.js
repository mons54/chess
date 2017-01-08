'use strict';

module.exports = Engine;

function Engine(game, start, end, promotion) {
    
    this.game = game;
    this.init(start, end, promotion);

    return this.game;
};

Engine.prototype.init = function (start, end, promotion) {

    var pieceStart = this.game.pieces[start],
        pieceEnd = this.game.pieces[end];

    if (!pieceStart) {
        return;
    }

    var typeMove = this.getTypeMove(pieceStart, end);

    if (!typeMove) {
        return;
    }

    this.game.lastTurn = {
        start: start,
        end: end
    };

    if (this.isPawnPromotion(pieceStart, end)) {
        pieceStart = this.getPawnPromotion(pieceStart.color, promotion);
    }

    var extension = '',
        sign = typeMove === 'capture' ? 'x' : ' ';

    if (typeMove === 'capture') {
        if (!pieceEnd) {
            this.deleteInPassing(end);
            extension += ' e.p.';
        }

        if (pieceStart.color == 'white') {
            this.game.black.nbPieces -= 1;
        } else {
            this.game.white.nbPieces -= 1;
        }
    } else {

        if (this.isCastling(pieceStart, end)) {
            this.castling(end);
            extension += end.charAt(0) === 'c' ? ' 0-0-0' : ' 0-0';
        }
    }

    this.game[this.game.turn].notation.unshift(start + sign + end + extension);

    this.positionInPassing = [];

    if (pieceStart.name == 'pawn' && !pieceStart.moved) {
        this.checkInPassing(pieceStart, end);
    }

    delete this.game.pieces[start];

    pieceStart.moved = true;

    this.game.pieces[end] = pieceStart;

    if (pieceStart.name == 'king') {
        this.game[pieceStart.color].king.position = end;
    }

    if (pieceStart.name == 'pawn' || typeMove == 'capture') {
        this.game.turn50 = 0;
    } else {
        this.game.turn50++;
    }

    if (this.game.time == 5400) {
        this.game[this.game.turn].time += 30;
    }

    if (this.game[this.game.turn].time > this.game[this.game.turn].timeTurn) {
        this.game[this.game.turn].timeTurn = this.game.timeTurn;
    } else {
        this.game[this.game.turn].timeTurn = this.game[this.game.turn].time;
    }

    this.game[this.game.turn].canDraw = false;

    this.game.turn = this.game.turn == 'white' ? 'black' : 'white';

    this.setMove();

    var position = [],
        code = '';

    for (var i in this.game.pieces) {
        position.push(i);
    }

    position.sort();

    for (var i in position) {
        code += position[i] + this.game.pieces[position[i]].name + this.game.pieces[position[i]].color;
    }

    code = code.hash();

    position = 0;

    for (var i in this.game.save) {
        if (code === this.game.save[i].code) {
            position++;
        }
    }

    if (this.turn50 >= 50 || position >= 3) {
        this.game[this.game.turn].canDraw = true;
    }

    this.game.played++;

    this.game.saved[this.game.played] = {
        code: code,
        start: start,
        end: end
    };

    if (this.checkmat == true) {
        this.game.finish = true;
        this.game.result = {
            name: 'mat'
        };
        if (this.game.turn == 'black') {
            this.game.result.value = 1;
        } else {
            this.game.result.value = 2;
        }
    } else if (this.pat == true || this.draw == true) {
        this.game.finish = true;
        this.game.result = {
            value: 0
        };
        if (this.pat == true) {
            this.game.result.name = 'pat';
        } else {
            this.game.result.name = 'nul';
        }
    }

    this.game.white.king.moveForbidden = [];
    this.game.black.king.moveForbidden = [];
};

Engine.prototype.setMove = function () {

    this.game.white.king.moveForbidden = [];
    this.game.black.king.moveForbidden = [];

    this.check = false;
    this.checkMove = false;

    var colors = ['white', 'black'];

    for (var i in colors) {

        var color = colors[i],
            letter,
            number;

        this.piecePosition = this.game[color].king.position;
        this.pieceColor = color;

        letter = parseInt(this.letterToNumber(this.piecePosition.substr(0, 1)));
        number = parseInt(this.piecePosition.substr(-1));

        this.letter = letter;
        this.number = number + 1;
        this.checkKingForbiden();

        this.number = number - 1;
        this.checkKingForbiden();

        this.letter = letter - 1;
        this.checkKingForbiden();

        this.number = number + 1;
        this.checkKingForbiden();

        this.letter = letter + 1;
        this.checkKingForbiden();

        this.number = number - 1;
        this.checkKingForbiden();

        this.number = number;
        this.checkKingForbiden();

        this.letter = letter - 1;
        this.checkKingForbiden();
    }

    this.stayPieces = {
        white: {},
        black: {}
    };

    var color = this.game.turn;
    this.setMovePiecesOtherThanKing(color);

    var color = this.reverseColor(this.game.turn);
    this.setMovePiecesOtherThanKing(color);

    this.draw = this.getDraw();

    this.setMovePiecesKing();

    this.setMat();
};

Engine.prototype.setMat = function () {

    this.checkmat = false;

    if (!this.check) {
        return;
    }

    this.checkmat = true;

    var key = this.game[this.game.turn].king.position,
        king = this.game.pieces[key];

    if (king.deplace.length || king.capture.length) {
        this.checkmat = false;
    }

    for (var i in this.game.pieces) {

        var piece = this.game.pieces[i];

        if (piece.color != this.game.turn || piece.name == 'king') {
            continue;
        }

        this.deplace = [];
        this.capture = [];

        if (this.check == 1) {
            this.setPieceMat(piece);
        }

        piece.deplace = this.deplace;
        piece.capture = this.capture;
    }

};

Engine.prototype.setPieceMat = function (piece) {

    if (piece.deplace.length) {

        this.setPieceMatDeplace(piece);
    }

    if (piece.capture.length) {

        this.setPieceMatCapture(piece);
    }
};

Engine.prototype.setPieceMatCapture = function (piece) {

    if (!this.kingCheckCapture) {
        return;
    }

    if (this.inArray(this.kingCheckCapture, piece.capture)) {

        this.checkmat = false;

        this.capture.push(this.kingCheckCapture);
    }
};

Engine.prototype.setPieceMatDeplace = function (piece) {

    if (!this.kingCheckDeplace || !this.kingCheckDeplace.length) {
        return;
    }

    for (var i in this.kingCheckDeplace) {

        var position = this.kingCheckDeplace[i];

        if (this.inArray(position, piece.deplace)) {

            this.checkmat = false;

            this.deplace.push(position);
        }
    }
};

Engine.prototype.getDraw = function () {

    if ((this.game.white.nbPieces == 1 && (this.game.black.nbPieces == 1 || (this.stayPieces.black.name == 'bishop' || this.stayPieces.black.name == 'knight'))) ||
        (this.game.black.nbPieces == 1 && (this.stayPieces.white.name == 'bishop' || this.stayPieces.white.name == 'knight'))) {
        return true;
    }
    
    if (this.stayPieces.white.name == 'bishop' && this.stayPieces.black.name == 'bishop') {

        var letterWhite = this.letterToNumber(this.stayPieces.white.position.substr(0, 1)),
            numberWhite = this.stayPieces.white.position.substr(-1),
            white = parseInt(letterWhite) + parseInt(numberWhite),
            letterBlack = this.letterToNumber(this.stayPieces.black.position.substr(0, 1)),
            numberBlack = this.stayPieces.black.position.substr(-1),
            black = parseInt(letterBlack) + parseInt(numberBlack);

        if (white % 2 == black % 2) {
            return true;
        }
    }

    return false;
};

Engine.prototype.setMovePiecesKing = function () {
    
    this.pat = true;

    for (var i in this.game.pieces) {

        this.piece = this.game.pieces[i];

        if (this.piece.name == 'king') {

            this.piece.position = i;

            this.setMovePiece();

            if (this.game.turn == this.piece.color && (this.piece.deplace.length > 0 || this.piece.capture.length > 0)) {
                this.pat = false;
            }

            delete this.piece.position;

        } else if (this.pat == true && this.game.turn == this.piece.color && (this.piece.deplace.length || this.piece.capture.length)) {
            this.pat = false;
        }
    }
};

Engine.prototype.setMovePiecesOtherThanKing = function (color) {

    for (var i in this.game.pieces) {

        this.piece = this.game.pieces[i];

        if (this.piece.color != color || this.piece.name == 'king') {
            continue;
        }

        this.piece.position = i;

        if (this.game[this.piece.color].nbPieces == 2) {
            this.stayPieces[this.piece.color] = {
                name: this.piece.name,
                position: this.piece.position
            };
        }

        this.setMovePiece();

        delete this.piece.position;
    }
};

Engine.prototype.setMovePiece = function () {

    this.saveCapture = [];
    this.deplaceBeforeKing = [];
    this.deplace = [];
    this.capture = [];

    var letter = parseInt(this.letterToNumber(this.piece.position.substr(0, 1))),
        number = parseInt(this.piece.position.substr(-1));

    if (this.piece.name == 'king') {
        this.setMoveKing(letter, number);
    } else if (this.piece.name == 'queen') {
        this.setMoveQueenRook(letter, number);
        this.setMoveQueenBishop(letter, number);
    } else if (this.piece.name == 'rook') {
        this.setMoveQueenRook(letter, number);
    } else if (this.piece.name == 'bishop') {
        this.setMoveQueenBishop(letter, number);
    } else if (this.piece.name == 'knight') {
        this.setMoveKnight(letter, number);
    } else if (this.piece.name == 'pawn') {
        this.setMovePawn(letter, number);
    }

    this.piece.deplace = this.deplace;
    this.piece.capture = this.capture;
};

Engine.prototype.setMovePawn = function (letter, number) {

    if (this.inPassing && this.game.turn == this.piece.color && this.inArray(this.piece.position, this.positionInPassing)) {
        this.capture.push(this.inPassing);
    }

    this.number = this.piece.color == 'white' ? number + 1 : number - 1;

    this.letter = letter + 1;
    this.checkCapturePawn();

    this.letter = letter - 1;
    this.checkCapturePawn();

    this.letter = letter;
    this.checkDeplacePawn();

    if (this.deplace.length > 0 && this.piece.moved == false) {
        if (this.piece.color == 'white') {
            this.number = number + 2;
        } else {
            this.number = number - 2;
        }

        this.letter = letter;
        this.checkDeplacePawn();
    }
};

Engine.prototype.checkDeplacePawn = function () {
    
    if (!this.checkPosition()) {
        return;
    }

    var position = this.getPosition();

    if (this.checkDeplace(position)) {
        this.deplace.push(position);
    }
};

Engine.prototype.checkCapturePawn = function () {
    
    if (!this.checkPosition()) {
        return;
    }

    var position = this.getPosition();

    if (this.checkCapture(position)) {
        this.capture.push(position);
    }

    if (this.game.turn != this.piece.color) {
        
        var color = this.reverseColor(this.piece.color);

        if (this.game[color].king.position == position) {

            this.check++;

            this.kingCheckCapture = this.piece.position;
        }

    }

    this.game[this.piece.color].king.moveForbidden.push(position);
};

Engine.prototype.setMoveKnight = function (letter, number) {
    
    this.letter = letter - 2;
    this.number = number - 1;
    this.checkMoveKnight();

    this.number = number + 1;
    this.checkMoveKnight();

    this.letter = letter + 2;
    this.checkMoveKnight();

    this.number = number - 1;
    this.checkMoveKnight();

    this.letter = letter + 1;
    this.number = number + 2;
    this.checkMoveKnight();

    this.number = number - 2;
    this.checkMoveKnight();

    this.letter = letter - 1;
    this.checkMoveKnight();

    this.number = number + 2;
    this.checkMoveKnight();
};

Engine.prototype.checkMoveKnight = function () {

    if (!this.checkPosition()) {
        return;
    }

    var position = this.getPosition();

    if (this.checkCapture(position)) {
        this.capture.push(position);
    } else if (this.checkDeplace(position)) {
        this.deplace.push(position);
    }

    var color = this.reverseColor(this.piece.color);
    
    if (this.game.turn != this.piece.color) {
        if (this.game[color].king.position == position) {
            this.check++;
            this.kingCheckCapture = this.piece.position;
        }
    }

    this.game[this.piece.color].king.moveForbidden.push(position);
};

Engine.prototype.setMoveQueenBishop = function (letter, number) {

    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter + this.current;
        this.number = number + this.current;
        this.setMoveQueenRookBishop();
    }

    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter - this.current;
        this.number = number - this.current;
        this.setMoveQueenRookBishop();

    }

    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter + this.current;
        this.number = number - this.current;
        this.setMoveQueenRookBishop();

    }

    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter - this.current;
        this.number = number + this.current;
        this.setMoveQueenRookBishop();

    }
};

Engine.prototype.setMoveQueenRook = function (letter, number) {
    
    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter;
        this.number = number + this.current;
        this.setMoveQueenRookBishop();
    }


    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter + this.current;
        this.number = number;
        this.setMoveQueenRookBishop();
    }

    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter;
        this.number = number - this.current;
        this.setMoveQueenRookBishop();
    }

    this.setParamsMoveQueenRookBishop();
    for (this.current = 1; this.current < 9; this.current++) {
        this.letter = letter - this.current;
        this.number = number;
        this.setMoveQueenRookBishop();
    }
};

Engine.prototype.setParamsMoveQueenRookBishop = function () {
    this.stop = false;
    this.kingCheckForbidden = false;
    this.deplaceBeforeKing2 = [];
    this.deplaceCheckKing = [];
};

Engine.prototype.setMoveQueenRookBishop = function () {

    if (!this.checkPosition()) {
        return;
    }
    
    var position = this.getPosition();

    if (this.stop == false) {
        this.checkMoveQueenRookBishopStop(position);
    } else if (this.game.turn != this.piece.color) {
        this.checkMoveQueenRookBishop(position)
    } else {
        this.current = 8;
    }
};

Engine.prototype.checkMoveQueenRookBishop = function (position) {
    
    var color = this.reverseColor(this.piece.color);

    if (this.checkCapture(position)) {

        if (this.game[color].king.position == position) {

            this.deplaceBeforeKing = this.deplaceBeforeKing2;

            this.pieceBeforeKing();
        }

        this.current = 8;
    } else if (this.checkDeplace(position)) {

        if (this.kingCheckForbidden == true) {

            this.game[this.piece.color].king.moveForbidden.push(position);
        }

        this.deplaceBeforeKing2.push(position);

    } else {

        if (this.kingCheckForbidden == true) {

            this.game[this.piece.color].king.moveForbidden.push(position);
        }

        this.current = 8;
    }
};

Engine.prototype.pieceBeforeKing = function () {

    var key = this.saveCapture,
        piece = this.game.pieces[key],
        deplace = [],
        capture = [];

    if (piece.name == 'queen' || piece.name == this.piece.name) {
        capture.push(this.piece.position);
        if (this.deplaceBeforeKing) {
            deplace = this.deplaceBeforeKing;
        }
    } else if (this.piece.name == 'queen' && piece.name != 'knight' && piece.name != 'pawn') {
        if (this.inArray(this.piece.position, piece.capture)) {
            capture.push(this.piece.position);
            if (this.deplaceBeforeKing) {
                deplace = this.deplaceBeforeKing;
            }
        }
    } else if (piece.name == 'pawn') {
        var letter = this.letterToNumber(this.piece.position.substr(0, 1)),
            letterPiece = this.letterToNumber(key.substr(0, 1));

        if (letter == letterPiece && !this.inArray(this.piece.position, piece.deplace)) {
            deplace = piece.deplace;
        }

        if (this.inArray(this.piece.position, piece.capture)) {
            capture.push(this.piece.position);
        }
    }

    this.game.pieces[key].deplace = deplace;
    this.game.pieces[key].capture = capture;
};

Engine.prototype.checkMoveQueenRookBishopStop = function (position) {
    
    if (this.checkCapture(position)) {

        this.setCaptureQueenRookBishop(position);

    } else if (this.checkDeplace(position)) {

        this.deplace.push(position);
        this.deplaceBeforeKing2.push(position);
        this.deplaceCheckKing.push(position);

        this.game[this.piece.color].king.moveForbidden.push(position);

    } else {

        this.game[this.piece.color].king.moveForbidden.push(position);

        this.current = 8;
    }
};

Engine.prototype.setCaptureQueenRookBishop = function (position) {

    this.capture.push(position);
    this.saveCapture = position;

    if (this.game.turn != this.piece.color) {

        var color = this.reverseColor(this.piece.color);

        if (this.game[color].king.position == position) {
            this.check++;
            this.kingCheckDeplace = this.deplaceCheckKing;
            this.kingCheckCapture = this.piece.position;
            this.kingCheckForbidden = true;
        }

        this.stop = true;

    } else {

        this.current = 8;
    }
};

Engine.prototype.setMoveKing = function (letter, number) {

    this.checkCastling();

    this.letter = letter;
    this.number = number + 1;
    this.checkMoveKing();

    this.number = number - 1;
    this.checkMoveKing();

    this.letter = letter - 1;
    this.checkMoveKing();

    this.number = number + 1;
    this.checkMoveKing();

    this.letter = letter + 1;
    this.checkMoveKing();

    this.number = number - 1;
    this.checkMoveKing();

    this.number = number;
    this.checkMoveKing();

    this.letter = letter - 1;
    this.checkMoveKing();
};

Engine.prototype.checkMoveKing = function () {

    if (!this.checkPosition()) {
        return;
    }

    var position = this.getPosition();

    if (this.checkCaptureKing(position)) {
        this.capture.push(position);
    } else if (this.checkDeplaceKing(position)) {
        this.deplace.push(position);
    }
};

Engine.prototype.checkDeplaceKing = function (position) {

    if (!this.checkDeplace(position)) {
        return;
    }

    return this.checkMoveForbiddenKing(position);
},

Engine.prototype.checkCaptureKing = function (position) {

    if (!this.checkCapture(position)) {
        return false;
    }

    return this.checkMoveForbiddenKing(position);
};

Engine.prototype.checkMoveForbiddenKing = function (position) {
    
    var color = this.reverseColor(this.piece.color);

    return !this.inArray(position, this.game[color].king.moveForbidden);
};

Engine.prototype.checkDeplace = function (position) {
    return !this.game.pieces[position];
};

Engine.prototype.checkCapture = function (position) {
    if (!this.checkPiece(position)) {
        return false;
    }
    return this.game.pieces[position].color != this.piece.color;
};

Engine.prototype.checkCastling = function () {

    if (this.check || this.piece.moved) {
        return;
    }

    var number = 1,
        color = 'black',
        moveForbidden;
    
    if (this.piece.color == 'black') {
        number = 8;
        color = 'white';
    }

    moveForbidden = this.game[color].king.moveForbidden;

    this.setCastling(moveForbidden, color, 'a', number);
    this.setCastling(moveForbidden, color, 'h', number);
};

Engine.prototype.setCastling = function (moveForbidden, color, letter, number) {

    var piece = this.game.pieces[letter + number];

    if (!piece || piece.name != 'rook' || piece.color != this.piece.color || piece.moved) {
        return;
    }

    var move = ['b' + number, 'c' + number, 'd' + number],
        position = 'c' + number;

    if (letter == 'h') {
        move = ['g' + number, 'f' + number];
        position = 'g' + number;
    }

    for (var i in move) {
        if (!this.inArray(move[i], piece.deplace) || this.inArray(move[i], moveForbidden)) {
            return;
        }
    }

    this.deplace.push(position);
};


Engine.prototype.checkKingForbiden = function () {
    if (this.checkPosition()) {
        this.game[this.pieceColor].king.moveForbidden.push(this.getPosition());
    }
};

Engine.prototype.checkInPassing = function (piece, end) {

    var number = end.substr(-1),
        letter,
        ligneTake = 3,
        lignePiece = 4;

    if (piece.color == 'black') {
        ligneTake = 6;
        lignePiece = 5;
    }

    if (number != lignePiece) {
        return;
    }

    letter = end.substr(0, 1);

    this.inPassing = letter + ligneTake;

    letter = this.letterToNumber(letter);

    this.number = number;

    this.letter = letter + 1;
    if (this.checkPosition()) {
        this.positionInPassing.push(this.getPosition());
    }

    this.letter = letter - 1;
    if (this.checkPosition()) {
        this.positionInPassing.push(this.getPosition());
    }
};

Engine.prototype.checkPiece = function (position) {
    return this.game.pieces[position];
}

Engine.prototype.checkPosition = function () {
    return this.letter > 0 && this.letter < 9 && this.number > 0 && this.number < 9;
};

Engine.prototype.getPosition = function () {
    return this.numberToLetter(this.letter) + this.number;
};

Engine.prototype.reverseColor = function (color) {
    return color == 'white' ? 'black' : 'white';
};

Engine.prototype.letterToNumber = function (letter) {
    switch (letter) {
        case 'a': return 1;
        case 'b': return 2;
        case 'c': return 3;
        case 'd': return 4;
        case 'e': return 5;
        case 'f': return 6;
        case 'g': return 7;
        case 'h': return 8;
    }
};

Engine.prototype.numberToLetter = function (number) {
    switch (number) {
        case 1: return 'a';
        case 2: return 'b';
        case 3: return 'c';
        case 4: return 'd';
        case 5: return 'e';
        case 6: return 'f';
        case 7: return 'g';
        case 8: return 'h';
    }
    return number;
};

Engine.prototype.castling = function (end) {
    var letter = end.substr(0, 1),
        number = end.substr(-1),
        rook;

    if (letter == 'c') {
        letter = 'd';
        rook = this.game.pieces['a' + number];
        delete this.game.pieces['a' + number];
    } else {
        letter = 'f';
        rook = this.game.pieces['h' + number];
        delete this.game.pieces['h' + number];
    }
    this.game.pieces[letter + number] = {
        name: rook.name,
        color: rook.color,
        deplace: [],
        capture: [],
        moved: true
    };
}

Engine.prototype.isCastling = function (piece, end) {
    if (piece.name != 'king' || piece.moved == true || !this.inArray(end, ['c1', 'g1', 'c8', 'g8'])) {
        return false;
    }
    return true;
};

Engine.prototype.getPawnPromotion = function (color, name) {
    if (!this.inArray(name, ['queen', 'rook', 'bishop', 'knight'])) {
        name = 'queen';
    }
    return {
        name: name,
        color: color,
        deplace: [],
        capture: [],
        moved: true
    };
};

Engine.prototype.isPawnPromotion = function (piece, end) {
    var number = end.substr(-1);
    if (piece.name == 'pawn' && ((piece.color == 'white' && number == '8') || (piece.color == 'black' && number == '1'))) {
        return true;
    }
    return false;
};

Engine.prototype.deleteInPassing = function (end) { 
    var letter = end.substr(0, 1),
        number = end.substr(-1);

    if (number == '3') {
        delete this.game.pieces[letter + '4'];
    } else {
        delete this.game.pieces[letter + '5'];
    }
};

Engine.prototype.getTypeMove = function (piece, end) {
    if (this.inArray(end, piece.deplace)) {
        return 'deplace';
    } else if (this.inArray(end, piece.capture)) {
        return 'capture';
    }
    return false;
};

Engine.prototype.inArray = function (needle, array) {
    return array.indexOf(needle) != -1;
};
