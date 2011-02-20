
/**
 * Module dependencies.
 */

//var io = require('socket.io'),
var routes = require('./routes.js');
    app = routes.app;

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(8080);
  console.log("Express server listening on port %d", app.address().port)
}

/*
var io = io.listen(app),
    buffer = [];

io.on('connection', function(client) {
  client.send({ buffer: buffer });
  client.broadcast({ announcement: client.sessionId + ' connected' });

  client.on('message', function(message) {
    var msg = { message: [client.sessionId, message] };
    buffer.push(msg);
    if (buffer.length > 15) { buffer.shift(); }
    client.broadcast(msg);
    // why doesn't broadcast send message to original sender?
  });

  client.on('disconnect', function(message) {
    client.broadcast({ announcement: client.sessionId + ' disconnected'});
  });
});
*/
