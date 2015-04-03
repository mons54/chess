module.exports = function (fbgraph, q) {
    return {
        get: function (path) {
            var defer = q.defer();
            fbgraph.get(path, function (error, response) {
                if (error) {
                    defer.reject(error);
                    return;
                }
                defer.resolve(response);
            });
            return defer.promise;
        },
        post: function (path) {
            var defer = q.defer();
            fbgraph.post(path, function (error, response) {
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
