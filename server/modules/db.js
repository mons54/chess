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
                lastGame: String,
                name: String,
                avatar: String,
                blitz: Number,
                rapid: Number,
                active_blitz: Boolean,
                active_rapid: Boolean,
                success: Number,
                unauthorized: Boolean,
                blackList: Object,
                trophies: Object
            })
            .index({blitz: 1})
            .index({rapid: 1})
            .index({active_blitz: 1})
            .index({active_rapid: 1})
            .index({active_blitz: 1, blitz: 1})
            .index({active_rapid: 1, rapid: 1})
        ),
        games: mongoose.model('games', 
            new mongoose.Schema({
                white: String,
                black: String,
                type: String,
                result: Number,
                date: Date,
                data: Object
            })
            .index({white: 1, type: 1})
            .index({black: 1, type: 1})
            .index({white: 1, type: 1, result: 1})
            .index({black: 1, type: 1, result: 1})
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
    return this.models[model].update(request, { $set: set }).exec();
};

Module.prototype.ObjectId = mongoose.Types.ObjectId;
