'use strict';

module.exports = function (app) {

    var express = require('express'),
        mongoose = require('mongoose'),
        bodyParser = require('body-parser'),
        staticPath = dirname + '/public/',
        dictionaries = {},
        acceptsLanguages;

    require('fs').readdirSync(staticPath + 'json/dictionaries').forEach(function (file) {
        
        var lang = file.substr(0, 2),
            dictionary = require(staticPath + 'json/dictionaries/' + file);

        dictionaries[lang] = {
            lang: lang,
            title: dictionary.title,
            description: dictionary.description
        };
    });

    acceptsLanguages = Object.keys(dictionaries);

    mongoose.connect('mongodb://mons54:jsOL160884@ds137139.mlab.com:37139/chess_test');

    app.use(express.static(staticPath));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.set('views', staticPath);
    app.set('view engine', 'ejs');

    app.get('/([a-z][^.]+)?', function (req, res) {
        var data,
            lang = req.acceptsLanguages(acceptsLanguages);

        if (!dictionaries.hasOwnProperty(lang)) {
            lang = 'en';
        }

        data = dictionaries[lang];

        res.render('index', data);
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
