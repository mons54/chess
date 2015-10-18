module.exports = function (app, express, mongoose) {

    mongoose.connect('mongodb://mons54:jsOL160884@oceanic.mongohq.com:10096/chess');

    var static = dirname + '/public/';

    app.use(express.static(static));
    app.use(require('body-parser').json());
    app.set('views', static);
    app.engine('html', require('ejs').renderFile);

    app.facebook = {
        appId: '459780557396952',
        secret: 'ffba6ba90d75f0e2ffd73d946fd5f1bd',
        redirectUri: 'https://apps.facebook.com/the-chess-game/'
    };
};
