module.exports = function (mongoose) {
    return {
        users: new mongoose.Schema({
            uid: {
                type: Number,
                unique: true
            },
            points: Number,
            tokens: Number,
            consWin: Number,
            active: Boolean,
            trophy: Number,
            parrainage: Number,
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
        }),
        freeTokens: new mongoose.Schema({
            uid: {
                type: Number,
                unique: true
            },
            time: Number
        }),
        payments: new mongoose.Schema({
            id: {
                type: Number,
                unique: true
            },
            uid: Number,
            item: Number,
            type: String,
            status: String,
            time: Number
        }),
        sponsorPay: new mongoose.Schema({
            id: {
                type: String,
                unique: true
            },
            uid: Number,
            amount: Number
        }),
        tokenAds: new mongoose.Schema({
            id: {
                type: String,
                unique: true
            },
            uid: Number,
            amount: Number
        })
    };
};
