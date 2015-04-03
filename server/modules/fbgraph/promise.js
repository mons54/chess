module.exports = function (fbgraph, q) {
    return {
        post: function (url) {
            var defer = q.defer();
            fbgraph.post(url, function (error, response) {
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
