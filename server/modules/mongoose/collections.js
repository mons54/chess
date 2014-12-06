module.exports = function (mongoose) {
    return {
        users: new mongoose.Schema({
            uid: {
                type: Number,
                unique: true
            },
            points: Number,
            tokens: Number,
            cons_game: Number,
            actif: Number,
            trophy: Number,
            parrainage: Number,
            ban: Boolean,
            moderateur: Boolean
        }),
        games: new mongoose.Schema({
            blanc: Number,
            noir: Number,
            resultat: Number,
            time: Number
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
