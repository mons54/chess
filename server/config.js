'use strict';

module.exports = function (app) {

    var express = require('express'),
        mongoose = require('mongoose'),
        bodyParser = require('body-parser'),
        staticPath = dirname + '/public/',
        dictionaries = {},
        defaultLanguage = 'en';

    require('fs').readdirSync(staticPath + 'json/dictionaries').forEach(function (file) {
        
        var lang = file.substr(0, 2),
            dictionary = require(staticPath + 'json/dictionaries/' + file);

        dictionaries[lang] = dictionary;
    });

    mongoose.connect('mongodb://127.0.0.1:27017/chess_new');

    app.use(express.static(staticPath));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.set('views', staticPath);
    app.set('view engine', 'ejs');

    app.all('/facebook', function (req, res) {
        var data = getMetaData(defaultLanguage);
        data.facebook = true;
        res.render('index', data);
    });

    app.get('/:lang([a-z]{2})/trophy/:id', function (req, res) {
        
        var data,
            lang = req.params.lang,
            id = req.params.id;

        if (!dictionaries.hasOwnProperty(lang)) {
            res.status(406).send('Invalid language');
            return;
        }

        data = dictionaries[lang].trophies.content[id];

        if (!data) {
            res.status(406).send('Invalid trophy id');
            return;
        }

        data.lang = lang;
        data.id = id;

        res.render('views/trophy', data);
    });

    app.get('(/:lang([a-z]{2}))?(/[a-z][^.]+)?', function (req, res) {
        
        var data = getMetaData(req.params.lang);
        data.facebook = false;

        res.render('index', data);
    });

    function getMetaData(lang) {

        if (!dictionaries.hasOwnProperty(lang)) {
            lang = defaultLanguage;
        }

        var data = dictionaries[lang];

        return {
            lang: lang,
            title: data.title,
            description: data.description
        };
    };
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
