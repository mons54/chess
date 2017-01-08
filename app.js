'use strict';

var express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io')(server);

global.dirname = __dirname;

require(dirname + '/server/utils');
require(dirname + '/server/config')(app);
require(dirname + '/server/modules/io')(app, io);

server.listen(process.env.PORT || 3000);
