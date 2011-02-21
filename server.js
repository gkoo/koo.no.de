
/**
 * Module dependencies.
 */

//var io = require('socket.io'),
var routes = require('./routes.js');
    io = require('socket.io'),
    app = routes.app,



/* ================ */
/* BEGIN GRID STUFF */
/* ================ */

    dimSize = 30,
    grid = [],
    // Init grid.
    initGrid = function() {
      for (var i=0; i<dimSize; ++i) {
        grid[i] = [];
        for (var j=0; j<dimSize; ++j) {
          grid[i][j] = 0;
        }
      }
    };

initGrid();

io = io.listen(app);

io.on('connection', function(client) {
  client.send({ grid: grid });

  client.on('message', function(message) {
    if ('type' in message) {
      switch (message.type) {
        case 'toggle':
          var x = message.x,
              y = message.y;

          if (grid[x][y]) { grid[x][y] = 0; }
          else { grid[x][y] = 1; }

          break;
        case 'toggleOn':
          //console.log('toggleon ('+message.x+', ' + message.y+')');
          grid[message.x][message.y] = 1;
          break;
        case 'clear':
          initGrid();
          break;
      }
      client.broadcast(message);
    }
  });

  client.on('disconnect', function(message) { });

});

/* ============== */
/* END GRID STUFF */
/* ============== */


// Only listen on $ node server.js

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
