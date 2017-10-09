'use strict';

module.exports = function (app) {

    function render(response, request, facebook, vkontakte, okru, lang, title, description, image) {

        var base = '/';

        lang = getLang(lang);

        if (request.params.lang === lang) {
            base += lang + '/';
        }

        if (!title) {
            title = dictionaries[lang].title;
        }

        if (!description) {
            description = dictionaries[lang].description;
        }

        if (!image) {
            image = 'logo.png';
        }

        return response.render('index', {
            env: env,
            base: base,
            path: request.url,
            facebook: facebook,
            vkontakte: vkontakte,
            okru: okru,
            lang: lang,
            title: title,
            description: description,
            image: image
        });
    }

    function getLang(lang) {

        if (!dictionaries.hasOwnProperty(lang)) {
            return defaultLanguage;
        }

        return lang;
    }

    var express = require('express'),
        mongoose = require('mongoose'),
        bodyParser = require('body-parser'),
        timeSyncServer = require('timesync/server'),
        db = require(dirname + '/server/modules/db'),
        staticPath = dirname + '/public/',
        dictionaries = {},
        defaultLanguage = 'en',
        env = process.env.NODE_ENV;

    require('fs').readdirSync(staticPath + 'json/dictionaries').forEach(function (file) {
        dictionaries[file.substr(0, 2)] = require(staticPath + 'json/dictionaries/' + file);
    });

    if (env === 'dev') {
        mongoose.connect('mongodb://mons54:jsOL160884@ds141209.mlab.com:41209/chess-test');
    } else {
        mongoose.connect('mongodb://127.0.0.1:27017/chess_new');
    }

    app.use(express.static(staticPath));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.set('views', staticPath);
    app.set('view engine', 'ejs');

    app.use('/timesync', timeSyncServer.requestHandler);

    app.get('/images', function(request, response) {
        if (!request.query.data) {
            response.redirect('/');
            return;
        }
        var img = new Buffer(request.query.data, 'base64');
        response.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        response.end(img); 
    });

    app.all('/facebook', function (request, response) {
        render(response, request, true, false, false);
    });

    app.all('/vkontakte', function (request, response) {
        render(response, request, false, request.query, false);
    });

    app.all('/okru', function (request, response) {
        render(response, request, false, false, request.query);
    });

    app.get('/:lang([a-z]{2})/user/:uid([a-f0-9]{24})/trophies/:id([0-9]{1,2})', function (request, response) {

        var id = request.params.id,
            lang = getLang(request.params.lang),
            trophy = dictionaries[lang].trophies.content[id];

        if (!trophy) {
            response.redirect('/');
        }

        render(
            response, 
            request, 
            false, 
            false, 
            false, 
            lang, 
            trophy.title, 
            trophy.description, 
            'trophies/trophy-' + id + '.png'
        );
    });

    app.get('/:lang([a-z]{2})/game/:gid([a-f0-9]{24})', function (request, response) {
        
        var gid = request.params.gid,
            objectId = db.objectId(gid),
            lang = getLang(request.params.lang);

        if (!objectId) {
            response.redirect('/');
            return;
        }

        db.findOne('games', { _id: objectId }).then(function (data) {

            var print;

            if (data.result === 1) {
                print = '1-0';
            } else if (data.result === 2) {
                print = '0-1';
            } else {
                print = '½-½';
            };

           var title = dictionaries[lang][data.type] + ' - ' + data.data.time / 60000 + '+' + data.data.increment / 1000 + ' - ' + dictionaries[lang][data.data.result.name],
                description = data.data.white.name + ' ' + data.data.white.points + ' - ' + print + ' - ' + data.data.black.name + ' ' + data.data.black.points,
                image = request.query.image ? '?data=' + encodeURIComponent(request.query.image) : null;

            render(
                response, 
                request, 
                false,
                false,
                false,
                lang,
                title,
                description,
                image
            );
        });
    });

    app.get('(/:lang([a-z]{2}))?(/[a-z][^.]+)?', function (request, response) {

        render(response, request, false, false, false, request.params.lang);
    });
};

String.prototype.hash = function() {
    var hash = 0, i, chr, len;
    if (this.length == 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash.toString();
};
