
/**
 * Module dependencies.
 */

var routes = require('./routes.js');
    io = require('socket.io'),
    app = routes.app,



/* ================ */
/* BEGIN GRID STUFF */
/* ================ */

    dimSize = 30,
    grid = [],
    gridDirty = false,    // whether anything is on the grid yet
    players = {},         // a hash of all currently active players
    nextId = 0,           // the next id to assign the next player
    // Init grid.
    initGrid = function() {
      for (var i=0; i<dimSize; ++i) {
        grid[i] = [];
        for (var j=0; j<dimSize; ++j) {
          grid[i][j] = '';
        }
      }
    };

initGrid();

io = io.listen(app);

io.on('connection', function(client) {
  if (!players[client.sessionId]) {
    players[client.sessionId] = { id: nextId++ };
  }
  if (gridDirty) {
    client.send({ grid: grid });
  }
  else {
    client.send({ grid: null });
  }

  client.on('message', function(message) {
    if ('type' in message) {
      switch (message.type) {
        case 'toggle':
          var x = message.x,
              y = message.y;

          //console.log('toggleon ('+message.x+', ' + message.y+')');
          grid[x][y] = message.currColorClass;
          gridDirty = true;
          message.playerId = players[client.sessionId].playerId;

          break;
        case 'clear':
          initGrid();
          gridDirty = false;
          break;
        case 'name':
          players[client.sessionId].name = message.name; // this is user input. watch out!
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
