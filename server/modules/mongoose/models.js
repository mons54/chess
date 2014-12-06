module.exports = function (mongoose) {
    return {
        users: mongoose.model('users', mongoose.collections.users),
        games: mongoose.model('parties', mongoose.collections.games),
        badges: mongoose.model('user_badges', mongoose.collections.badges),
        freeTokens: mongoose.model('free_tokens', mongoose.collections.freeTokens),
        payments: mongoose.model('paiements', mongoose.collections.payments),
        sponsorPay: mongoose.model('sponsor_pays', mongoose.collections.sponsorPay),
        tokenAds: mongoose.model('token_ads', mongoose.collections.tokenAds)
    };
};
