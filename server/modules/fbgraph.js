module.exports = function (fbgraph, q) {
    fbgraph.promise = require(dirname + '/server/modules/fbgraph/promise')(fbgraph, q);
};
