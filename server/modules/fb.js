'use strict';

var fbgraph = require('fbgraph'),
    q = require('q');

var Module = {};

Module.get = function (path) {
    var defer = q.defer();
    fbgraph.get(path, function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};

Module.post = function (path) {
    var defer = q.defer();
    fbgraph.post(path, function (error, response) {
        if (error) {
            defer.reject(error);
            return;
        }
        defer.resolve(response);
    });
    return defer.promise;
};

module.exports = Module;
