'use strict';

const mongoose = require('mongoose');
const q = require('q');

module.exports = new Module();

function Module() {
    this.models = {
        users: mongoose.model('users', new mongoose.Schema({
            uid: {
                type: Number,
                unique: true
            },
            points: Number,
            consWin: Number,
            active: Boolean,
            ban: Boolean,
            moderateur: Boolean,
            blackListGame: Object
        })),
        games: mongoose.model('games', new mongoose.Schema({
            white: Number,
            black: Number,
            result: Number,
            date: Date
        })),
        trophies: mongoose.model('trophies', new mongoose.Schema({
            uid: Number,
            trophy: Number,
        }).index({uid: 1, trophy: 1}, {unique: true}))
    };

}

Module.prototype.all = function (promises) {
    return q.all(promises);
};

Module.prototype.findOne = function (model, request, fields) {
    var defer = q.defer();
    this.models[model]
    .findOne(request, fields, function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};

Module.prototype.find = function (model, request) {
    var defer = q.defer();
    this.models[model]
    .find(request, function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};

Module.prototype.count = function (model, request) {
    var defer = q.defer();
    this.models[model]
    .count(request, function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};

Module.prototype.exec = function (model, request, sort, skip, limit, hint) {
    var defer = q.defer();
    this.models[model]
    .find(request)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .hint(hint)
    .exec(function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};

Module.prototype.save = function (model, data) {
    var defer = q.defer();
    new this.models[model](data)
    .save(function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};

Module.prototype.update = function (model, request, set) {
    var defer = q.defer();
    this.models[model]
    .update(request, { $set: set }, function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};