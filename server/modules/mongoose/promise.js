module.exports = function (mongoose, q) {

    return {
        findOne: function (model, request, fields) {
            var defer = q.defer();
            mongoose.models[model]
            .findOne(request, fields, function (error, response) {
                if (error) {
                    defer.reject(error);
                    return;
                }
                defer.resolve(response);
            });
            return defer.promise;
        },
        find: function (model, request) {
            var defer = q.defer();
            mongoose.models[model]
            .find(request, function (error, response) {
                if (error) {
                    defer.reject(error);
                    return;
                }
                defer.resolve(response);
            });
            return defer.promise;
        },
        count: function (model, request) {
            var defer = q.defer();
            mongoose.models[model]
            .count(request, function (error, response) {
                if (error) {
                    defer.reject(error);
                    return;
                }
                defer.resolve(response);
            });
            return defer.promise;
        },
        exec: function (model, request, sort, skip, limit, hint) {
            var defer = q.defer();
            mongoose.models[model]
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
        },
        save: function (model, data) {
            var defer = q.defer();
            new mongoose.models[model](data)
            .save(function (error, response) {
                if (error) {
                    defer.reject(error);
                    return;
                }
                defer.resolve(response);
            });
            return defer.promise;
        },
        update: function (model, request, set) {
            var defer = q.defer();
            mongoose.models[model]
            .update(request, { $set: set }, function (error, response) {
                if (error) {
                    defer.reject(error);
                    return;
                }
                defer.resolve(response);
            });
            return defer.promise;
        }
    }
};
