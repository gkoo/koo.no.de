
/**
 * Module dependencies.
 */

var PORT       = 80,
    routes     = require('./routes.js'),
    gridModule = require('./gridserver.js'),
    app        = routes.app;


gridModule.listen(app);

/* ============== */
/* END GRID STUFF */
/* ============== */


// Only listen on $ node server.js

if (!module.parent) {
  app.listen(PORT);
  console.log("Express server listening on port %d", app.address().port);
}
