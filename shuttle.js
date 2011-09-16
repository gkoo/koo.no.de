// Proxy to call Google Maps API for our LinkedIn Shuttle Tracker hack.
// Since Google Maps doesn't seem to support JSONP, I have to use koonode
// to relay the call.

var http = require('http'),

Shuttle = function() {
  this.listen = function(app) {
    app.get('/linkedinshuttle', function(req, res) {
      res.render('lishuttle', { layout: false });
    });

    app.get('/distanceproxy/:originlatlng/:destlatlng', function(req, res) {
      var params       = req.params,
          originlatlng = decodeURIComponent(params.originlatlng),
          destlatlng   = decodeURIComponent(params.destlatlng),
          mapsPath     = '/maps/api/distancematrix/json?callback=?&sensor=false&origins='+originlatlng+'&destinations='+destlatlng,
          options      = { host: 'maps.googleapis.com',
                          path: mapsPath,
                          port: 80,
                          method: 'GET',
                          headers: { 'Content-Type': 'application/json' }
                        },
          response = '',
          wrapper = req.query['callback'] ? req.query['callback'] : 'callback',
          httpreq;
      httpreq = http.request(options, function(httpres) {
        httpres.on('data', function(chunk) {
          response += chunk;
        });
        httpres.on('end', function() {
          res.send(wrapper + '(' + response + ')');
        });
      });
      httpreq.end();
    });
  };
};

module.exports = new Shuttle();
