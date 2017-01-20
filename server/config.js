'use strict';

var express = require('express'),
    mongoose = require('mongoose');

module.exports = function (app) {

    mongoose.connect('mongodb://mons54:jsOL160884@ds011321.mlab.com:11321/chess');


    var staticPath = dirname + '/public/',
        bodyParser = require('body-parser'),
        dictionaries = {};

    app.use(express.static(staticPath));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.set('views', staticPath);
    app.engine('html', require('ejs').renderFile);

    app.use(function (req, res, next) {
        console.log(req.url)
      next();
    });

    app.get('/docs/*', function (req, res) {
        res.sendFile(staticPath + 'docs/index.html');
    });

    require('fs').readdirSync(staticPath + 'json/dictionaries').forEach(function (file) {
        var dictionary = require(staticPath + 'json/dictionaries/' + file);
        dictionaries[file.substr(0, 2)] = {
            title: dictionary.title,
            description: dictionary.description
        };
    });

    app.get('/:lang([a-z0-9]+)?/([a-z0-9]+)?', function (req, res) {
        var data;
        if (dictionaries[req.params.lang]) {
            data = dictionaries[req.params.lang];
        }
        console.log('toto')
        res.sendFile(staticPath + 'index.html', data);
    });

    app.get('/*[^.map]$', function(req, res) {
        res.redirect('/')
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
