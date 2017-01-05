module.exports = function () {

    var Engine = require(dirname + '/server/modules/game/engine'),
        moduleGame = require(dirname + '/server/modules/game');

    this.move = function (start, end, promotion) {
        this.game = new Engine(this.game, start, end, promotion);
    };

    this.newGame = function (gid) {
        this.game = moduleGame.get(gid, {
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
        }, 300);
    }

    return this;
};
