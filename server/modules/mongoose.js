module.exports = function (mongoose) {
    mongoose.collections = require(dirname + '/server/modules/mongoose/collections')(mongoose);
    mongoose.models = require(dirname + '/server/modules/mongoose/models')(mongoose);
};
