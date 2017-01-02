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

    app.all('/docs/*', function (req, res) {
        res.sendFile(staticPath + 'docs/index.html');
    });

    app.all('/*', function (req, res) {
        res.sendFile(staticPath + 'index.html');
    });
};
