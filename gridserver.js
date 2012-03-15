var io     = require('socket.io'),

GridModule = function() {
  var grid    = [],
      gridDirty = false,    // whether anything is on the grid yet
      DIMSIZE = 30,
      COLORS  = ['black', 'brown', 'red', 'green', 'blue', 'yellow', 'white'],
      WHITE   = COLORS.length-1,

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
    io = io.listen(app, {
      //rememberTransport: false,
      transports: ['xhr-polling', 'htmlfile', 'jsonp-polling']
    });
    io.sockets.on('connection', initConnection);

    // Routes: Grid
    // ------------
    app.get('/grid', function(req, res){
      res.render('grid', {
        locals: {
          page: 'grid',
          dimSize: DIMSIZE,
          title: 'Welcome to the Grid'
        },
        layout: false
      });
    });
  };

  initGrid();
};

module.exports = new GridModule();
