/* ================ */
/* BEGIN GRID STUFF */
/* ================ */

var DIMSIZE = 30,
    COLORS  = ['black', 'red', 'green', 'blue', 'yellow', 'white'],
    grid = [],
    gridDirty = false,    // whether anything is on the grid yet
    players = {},         // a hash of all currently active players
    nextId = 0,           // the next id to assign the next player

    // Init grid.
    initGrid = function() {
      for (var i=0; i<DIMSIZE; ++i) {
        grid[i] = [];
        for (var j=0; j<DIMSIZE; ++j) {
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

exports.handleMessage = function(msg, client) {
  if ('type' in msg) {
    if (msg.type === 'toggle') {
      var x = msg.x,
          y = msg.y;

      client.broadcast(msg);
      //console.log('toggleon ('+msg.x+', ' + msg.y+')');
      grid[x][y] = msg.currColorClass;
      gridDirty = true;
      //msg.playerId = players[client.sessionId].playerId;
    }
    else if (msg.type === 'clear') {
      client.broadcast(msg);
      initGrid();
      gridDirty = false;
    }
    else if (msg.type === 'name') {
      client.broadcast(msg);
      players[client.sessionId].name = msg.name; // this is user input. watch out!
    }
    else if (msg.type === 'printGrid') {
      var outputStr = '',
          i = 0,
          j;
      client.broadcast(msg);
      for (; i<DIMSIZE; ++i) {
        for (j=0; j<DIMSIZE; ++j) {
          outputStr += getColorId(grid[j][i]);
        }
        outputStr += '\n';
      }
      console.log('Printing grid...\n' + outputStr + '\nDone printing grid...');
    }
  }
};

exports.initConnection = function(client) {
  if (!players[client.sessionId]) {
    players[client.sessionId] = { id: nextId++ };
  }
  if (gridDirty) {
    client.send({ grid: grid });
  }
  else {
    client.send({ grid: null });
  }
}
