var express     = require('express'),
    app         = express(),
    server      = require('http').createServer(app),
    io          = require('socket.io')(server),
    mongoose    = require('mongoose'),
    fbgraph     = require('fbgraph'),
    q           = require('q'),
    crypto      = require('crypto');

global.dirname = __dirname;

require(dirname + '/server/config')(app, express, mongoose);

require(dirname + '/server/modules/mongoose')(mongoose, q);
require(dirname + '/server/modules/fbgraph')(fbgraph, q);
require(dirname + '/server/modules/io')(app, io, mongoose, fbgraph, q, crypto);

require(dirname + '/server/routes/payment')(app, mongoose, crypto, fbgraph);
require(dirname + '/server/routes/sponsorpay')(app, mongoose, crypto);
require(dirname + '/server/routes/tokenads')(app, mongoose, crypto);

require(dirname + '/server/router')(app);

server.listen(process.env.PORT || 3000);
