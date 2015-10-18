module.exports = function (mongoose) {
    return {
        users: mongoose.model('users', mongoose.collections.users),
        games: mongoose.model('parties', mongoose.collections.games),
        badges: mongoose.model('user_badges', mongoose.collections.badges)
    };
};
