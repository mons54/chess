module.exports = function (app, express, mongoose) {

    mongoose.connect('mongodb://mons54:jsOL160884@oceanic.mongohq.com:10096/chess');

    var staticPath = dirname + '/public/',
        bodyParser = require('body-parser');

    app.use(express.static(staticPath));
    app.use(bodyParser.urlencoded());
    app.use(bodyParser.json());
    app.set('views', staticPath);
    app.engine('html', require('ejs').renderFile);

    app.facebook = {
        appId: '459780557396952',
        secret: 'ffba6ba90d75f0e2ffd73d946fd5f1bd',
        redirectUri: 'https://apps.facebook.com/the-chess-game/'
    };
};
