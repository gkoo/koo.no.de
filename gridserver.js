var io     = require('socket.io'),

/*
io = io.listen(app, {
  rememberTransport: false,
  transports: ['htmlfile', 'xhr-polling', 'jsonp-polling']
});
*/

GridModule = function() {
  var grid    = [],
      gridDirty = false,    // whether anything is on the grid yet
      DIMSIZE = 30,
      WHITE   = 5,
      COLORS  = ['black', 'red', 'green', 'blue', 'yellow', 'white'],

  initGrid = function() {
    for (var i=0; i<DIMSIZE; ++i) {
      grid[i] = [];
      for (var j=0; j<DIMSIZE; ++j) {
        grid[i][j] = WHITE;
      }
    }
  },

  initConnection = function(client) {
    if (gridDirty) {
      client.emit('grid', grid);
    }
    else {
      client.emit('grid', null);
    }

    client.on('clear', function() {
      io.sockets.emit('clear');
      initGrid();
      gridDirty = false;
    });

    client.on('togglePixels', function(data) {
      var x, y, i, len, toggleData;

      io.sockets.emit('togglePixels', data);
      for (i=0, len=data.length; i<len; ++i) {
        toggleData = data[i];
        x = toggleData.x;
        y = toggleData.y;
        grid[x][y] = toggleData.currColor;
      }
      gridDirty = true;
      //data.playerId = players[client.sessionId].playerId;
    });
  };

  this.listen = function(app) {
    io = io.listen(app);
    io.sockets.on('connection', function(client) {
      initConnection(client);
    });
  };

  initGrid();
};

module.exports = new GridModule();
