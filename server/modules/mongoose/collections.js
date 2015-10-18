module.exports = function (mongoose) {
    return {
        users: new mongoose.Schema({
            uid: {
                type: Number,
                unique: true
            },
            points: Number,
            consWin: Number,
            active: Boolean,
            ban: Boolean,
            moderateur: Boolean,
            blackListGame: Object
        }),
        games: new mongoose.Schema({
            white: Number,
            black: Number,
            result: Number,
            date: Date
        }),
        badges: new mongoose.Schema({
            uid: Number,
            badge: Number
        })
    };
};
