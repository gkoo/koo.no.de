
/**
 * Module dependencies.
 */

var PORT  = 80,
    routes  = require('./routes.js'),
    li      = require('./lihelper.js'),
    io      = require('socket.io'),
    app     = routes.app,
    COLORS  = ['black', 'red', 'green', 'blue', 'yellow', 'white'],



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
    },
    getColorId = function(colorName) {
      var i=0;
      if (typeof colorName !== 'string') { return -1; }
      if (colorName === '') { return 0; }
      for (; i<COLORS.length; ++i) {
        if (COLORS[i] === colorName) { return i+1; }
      }
      // should never return this. it's just
      // a randomly large integer so it stands
      // out in the output
      return 888888;
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
      if (message.type === 'toggle') {
        var x = message.x,
            y = message.y;

        client.broadcast(message);
        //console.log('toggleon ('+message.x+', ' + message.y+')');
        grid[x][y] = message.currColorClass;
        gridDirty = true;
        message.playerId = players[client.sessionId].playerId;
      }
      else if (message.type === 'clear') {
        client.broadcast(message);
        console.log('clearing grid');
        initGrid();
        gridDirty = false;
      }
      else if (message.type === 'name') {
        client.broadcast(message);
        players[client.sessionId].name = message.name; // this is user input. watch out!
      }
      else if (message.type === 'printGrid') {
        var outputStr = '',
            i = 0,
            j;
        client.broadcast(message);
        for (; i<dimSize; ++i) {
          for (j=0; j<dimSize; ++j) {
            outputStr += getColorId(grid[j][i]);
          }
          outputStr += '\n';
        }
        console.log('Printing grid...\n' + outputStr + '\nDone printing grid...');
      }

      // ========
      // LINKEDIN
      // ========
      else if (message.type === 'storeOwnProfile') {
        li.storeProfile(message.profile, true);
      }
      else if (message.type === 'storeConnections') {
        li.storeConnections(message.profiles, function(err) {
          li.getAllConnections(function(err, connections) {
            client.send({ type: 'allConnectionsResult', connections: connections });
          });
          //client.send({ type: 'connectionsStored' });
        });
      }
      else if (message.type === 'getConnectionsByCompany' && message.companies) {
        li.getConnectionsByCompany(message.companies, function(err, connections) {
          if (err) {
            console.log(err);
          }
          else if (connections) {
            client.send({
              type: 'connectionsByCompanyResult',
              companies: message.companies,
              connections: connections
            });
          }
        });
      }
      else if (message.type === 'myCompanies' && message.companies) {
        li.storeMyCompanies(message.companies);
      }
    }
  });

  client.on('disconnect', function(message) { });

});

/* ============== */
/* END GRID STUFF */
/* ============== */


// Only listen on $ node server.js

if (!module.parent) {
  app.listen(PORT);
  console.log("Express server listening on port %d", app.address().port);
}
