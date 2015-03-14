module.exports = function (app, express) {

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

    app.items = {
        5: {
            tokens: 5000,
            amount: 20
        },
        4: {
            tokens: 1500,
            amount: 10
        },
        3: {
            tokens: 500,
            amount: 5
        },
        2: {
            tokens: 150,
            amount: 2
        },
        1: {
            tokens: 50,
            amount: 1
        }
    };

    app.itemsAmount = {};

    for (var item in app.items) {
        
        var data = app.items[item];
        
        app.itemsAmount[data.amount] = {
            tokens: data.tokens,
            item: item
        };
    }
};
