
/**
 * Module dependencies.
 */

var PORT    = 80,
    routes  = require('./routes.js'),
    li      = require('./lihelper.js'),
    gridMod = require('./gridserver.js'),
    io      = require('socket.io'),
    app     = routes.app;





/*
io = io.listen(app, {
  transports: ['htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
});
*/
io = io.listen(app);

io.on('connection', function(client) {
  gridMod.initConnection(client);

  client.on('message', function(message) {
    if ('app' in message) {
      if (message.app === 'grid') {
        gridMod.handleMessage(message, client);
      }
      else if (message.app == 'timeline') {
        li.handleMessage(message, client);
      }
    }
  });

  //client.on('disconnect', function(message) { });

});

/* ============== */
/* END GRID STUFF */
/* ============== */


// Only listen on $ node server.js

if (!module.parent) {
  app.listen(PORT);
  console.log("Express server listening on port %d", app.address().port);
}
