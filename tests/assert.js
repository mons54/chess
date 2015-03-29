module.exports = function () {

    return {
        getName: function (name) {
            switch(name) {
                case 'roi'      : return 'king';
                case 'reine'    : return 'queen';
                case 'tour'     : return 'rook';
                case 'fou'      : return 'bishop';
                case 'cavalier' : return 'knight';
                case 'pion'     : return 'pawn';
            }
        },
        getColor: function (color) {
            if (color === 'blanc')  {
                return 'white';
            }
            return 'black';
        },
        getMove: function (position) {
            return position ? position.split('.') : [];
        },
        getBoolean: function (value) {
            if (value == 1) {
                return true;
            }
            return false;
        },
        setOldGame: function (oldGame) {

            oldGame.blanc.roi.moveForbidden = this.getMove(oldGame.blanc.roi.deplacement_interdit);
            oldGame.noir.roi.moveForbidden = this.getMove(oldGame.noir.roi.deplacement_interdit);

            delete oldGame.blanc.roi.deplacement_interdit;
            delete oldGame.noir.roi.deplacement_interdit;

            oldGame.blanc.king = oldGame.blanc.roi;
            oldGame.noir.king = oldGame.noir.roi;

            delete oldGame.blanc.roi;
            delete oldGame.noir.roi;

            oldGame.blanc.nbPieces = oldGame.blanc.pieces;
            oldGame.noir.nbPieces = oldGame.noir.pieces;

            delete oldGame.blanc.pieces;
            delete oldGame.noir.pieces;

            oldGame.white = oldGame.blanc;
            oldGame.black = oldGame.noir;

            delete oldGame.blanc;
            delete oldGame.noir;

            oldGame.turn = this.getColor(oldGame.tour);
            delete oldGame.tour;

            oldGame.finish = this.getBoolean(oldGame.terminer);
            delete oldGame.terminer;

            oldGame.played = oldGame.coup;
            delete oldGame.coup;

            oldGame.turn50 = oldGame._50_coup;
            delete oldGame._50_coup;

            oldGame.pieces = {};
            for (var key in oldGame.position) {
                var value = oldGame.position[key];

                var name = this.getName(value.nom);

                if (!name) {
                    console.log(value);
                }
                oldGame.pieces[key] = {
                    name: this.getName(value.nom),
                    color: this.getColor(value.couleur),
                    deplace: this.getMove(value.deplacement),
                    capture: this.getMove(value.capture),
                    moved: this.getBoolean(value.move)
                };
            }

            delete oldGame.position;

            return oldGame;
        },
        setNewGame: function (newGame) {
            delete newGame.white.timeTurn;
            delete newGame.white.canDraw;
            delete newGame.black.timeTurn;
            delete newGame.black.canDraw;

            return newGame;
        },
        checkGame: function (oldGame, newGame) {
            if (oldGame.turn !== newGame.turn) {
                return this.message('turn', oldGame.turn, newGame.turn);
            }

            if (oldGame.finish !== newGame.finish) {
                return this.message('finish', oldGame.finish, newGame.finish);
            }

            if (oldGame.white.king.position !== newGame.white.king.position) {
                return this.message('white.king.position', oldGame.white.king.position, newGame.white.king.position);
            }

            if (oldGame.black.king.position !== newGame.black.king.position) {
                return this.message('black.king.position', oldGame.black.king.position, newGame.black.king.position);
            }

            if (!this.compareArray(oldGame.white.king.moveForbidden, newGame.white.king.moveForbidden)) {
                return this.message('white.king.moveForbidden', oldGame.white.king.position, newGame.white.king.position);
            }

            if (!this.compareArray(oldGame.black.king.moveForbidden, newGame.black.king.moveForbidden)) {
                return this.message('black.king.moveForbidden', oldGame.black.king.position, newGame.black.king.position);
            }

            if (!this.compareObject(oldGame.pieces, newGame.pieces)) {
                return this.message('pieces', oldGame.pieces, newGame.pieces);
            }

            return true;
        },
        compareObject: function (object1, object2) {
            for (var key in object1) {
                if (object1[key] instanceof Array) {
                    if (!this.compareArray(object1[key], object2[key])) {
                        return false;
                    }
                } else if (typeof(object1[key]) === 'object') {
                    if (!this.compareObject(object1[key], object2[key])) {
                        return false;
                    }
                } else if (object1[key] !== object2[key]) {
                    return false;
                }
            }
            return true;
        },
        compareArray: function (array1, array2) {
            if (array1.length != array2.length) {
                return false;
            }

            for (var key in array1) {
                if (array1[key] != array2[key]) { 
                    return false;
                }
            }
            return true;
        },
        message: function (message, oldGame, newGame) {
            return {
                message: message + ' invalid !!!',
                oldGame: oldGame,
                newGame: newGame
            };
        }
    }
};