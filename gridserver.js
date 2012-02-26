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

  initConnection = function(socket) {
    if (gridDirty) {
      socket.emit('grid', grid);
    }
    else {
      socket.emit('grid', null);
    }

    socket.on('clear', function() {
      // Send to everyone except the socket we received from.
      socket.broadcast.emit('clear');
      initGrid();
      gridDirty = false;
    });

    socket.on('togglePixels', function(data) {
      var x, y, i, len, toggleData;

      socket.broadcast.emit('togglePixels', data);
      for (i=0, len=data.length; i<len; ++i) {
        toggleData = data[i];
        x = toggleData.x;
        y = toggleData.y;
        grid[x][y] = toggleData.currColor;
      }
      gridDirty = true;
      //data.playerId = players[socket.sessionId].playerId;
    });
  };

  this.listen = function(app) {
    io = io.listen(app);
    io.sockets.on('connection', initConnection);
  };

  initGrid();
};

module.exports = new GridModule();
