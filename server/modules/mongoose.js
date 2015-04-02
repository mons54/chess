module.exports = function (mongoose, q) {
    mongoose.collections = require(dirname + '/server/modules/mongoose/collections')(mongoose);
    mongoose.models = require(dirname + '/server/modules/mongoose/models')(mongoose);
    mongoose.promise = require(dirname + '/server/modules/mongoose/promise')(mongoose, q);
};
