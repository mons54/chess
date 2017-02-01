module.exports = function () {

    var chess = require(dirname + '/public/chess');

    this.move = function (start, end, promotion) {
        this.game = new chess.engine(this.game, start, end, promotion);
    };

    this.newGame = function (gid) {
        this.game = chess.game.newGame({
            uid: 1,
            name: 'tester1',
            avatar: null,
            points: 1500,
            ranking: 1
        }, {
            uid: 2,
            name: 'tester2',
            avatar: null,
            points: 1500,
            ranking: 1
        }, {
            type: 'blitz',
            time: 300,
            increment: 0
        });

        this.game.id = gid;
    }

    return this;
};
