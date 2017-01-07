'use strict';

var mongoose = require('mongoose'),
    q = require('q');

mongoose.Promise = q.Promise;

module.exports = new Module();

function Module() {
    this.models = {
        users: mongoose.model('users', 
            new mongoose.Schema({
                facebookId: {
                    type: String,
                    trim: true, 
                    index: true, 
                    unique: true, 
                    sparse: true
                },
                googleId: {
                    type: String,
                    trim: true, 
                    index: true, 
                    unique: true, 
                    sparse: true
                },
                name: String,
                avatar: String,
                points: Number,
                consWin: Number,
                active: Boolean,
                ban: Boolean,
                blackList: Object,
                trophies: Array
            })
            .index({active: 1})
            .index({points: 1})
            .index({_id: 1, points: 1})
            .index({_id: 1, active: 1})
            .index({active: 1, points: 1})
        ),
        games: mongoose.model('games', 
            new mongoose.Schema({
                white: String,
                black: String,
                result: Number,
                date: Date
            })
        )
    };

}

Module.prototype.all = function (promises) {
    return q.all(promises);
};

Module.prototype.findOne = function (model, request, fields) {
    return this.models[model].findOne(request, fields);
};

Module.prototype.find = function (model, request) {
    return this.models[model].find(request);
};

Module.prototype.count = function (model, request) {
    return this.models[model].count(request);
};

Module.prototype.exec = function (model, request, sort, skip, limit, hint) {
    return this.models[model]
    .find(request)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .hint(hint)
    .exec();
};

Module.prototype.save = function (model, data) {
    return new this.models[model](data).save();
};

Module.prototype.update = function (model, request, set) {
    return this.models[model].update(request, { $set: set });
};

Module.prototype.ObjectId = mongoose.Types.ObjectId;
