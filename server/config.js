'use strict';

var express = require('express'),
    mongoose = require('mongoose');

module.exports = function (app) {

    mongoose.connect('mongodb://mons54:jsOL160884@ds011321.mlab.com:11321/chess');


    var staticPath = dirname + '/public/',
        bodyParser = require('body-parser');

    app.use(express.static(staticPath));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.set('views', staticPath);
    app.engine('html', require('ejs').renderFile);

    app.facebook = {
        appId: '459780557396952',
        secret: 'ffba6ba90d75f0e2ffd73d946fd5f1bd',
        redirectUri: 'https://apps.facebook.com/the-chess-game/'
    };

    app.all('/docs/*', function (req, res) {
        res.sendFile(staticPath + 'docs/index.html');
    });

    app.all('/*', function (req, res) {
        res.sendFile(staticPath + 'index.html');
    });
};
