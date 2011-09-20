// Proxy to call Google Maps API for our LinkedIn Shuttle Tracker hack.
// Since Google Maps doesn't seem to support JSONP, I have to use koonode
// to relay the call.

var http = require('http'),

Shuttle = function() {
  var stops = [
    {
      name: "Lombard & Fillmore",
      location: {
        latitude: 37.799985,
        longitude: -122.436018
      }
    },
    {
      name: "Union & Van Ness",
      location: {
        latitude: 37.798679,
        longitude: -122.424109
      }
    },
    {
      name: "Sacramento & Van Ness",
      location: {
        latitude: 37.791388,
        longitude: -122.422425
      }
    },
    {
      name: "Divisadero & Grove",
      location: {
        latitude: 37.775956,
        longitude: -122.437928
      }
    },
    {
      name: "Castro & Market",
      location: {
        latitude: 37.762768,
        longitude: -122.435181
      }
    },
    {
      name: "24th St. & Noe",
      location: {
        latitude: 37.751512,
        longitude: -122.431866
      }
    },
    {
      name: "24th St. & Mission",
      location: {
        latitude: 37.752284,
        longitude: -122.418433
      }
    },
    {
      name: "Cesar Chavez & Folsom",
      location: {
        latitude: 37.748271,
        longitude: -122.413659
      }
    },
    {
      name: "Millbrae Caltrain Station",
      location: {
        latitude: 37.601193,
        longitude: -122.384852
      }
    },
    {
      name: "LinkedIn Sales Development",
      location: {
        latitude: 37.419782,
        longitude: -122.088554
      }
    },
    {
      name: "LinkedIn Campus",
      location: {
        latitude: 37.423301,
        longitude: -122.071956
      }
    }
  ],

  // Takes lat and lng args and returns the closest stop to that lat/lng pair.
  getClosestStop = function(lat, lng) {
    var i, len, stop, minDistance = -1, minStop, currDistance;
    for (i=0, len=stops.length; i<len; ++i) {
      stop = stops[i];
      currDistance = getDistance({ x: lat, y: lng }, { x: stop.location.latitude, y: stop.location.longitude });
      if (minDistance < 0 || currDistance < minDistance) {
        minDistance = currDistance;
        minStop = i;
      }
    }
    return minStop;
  },

  // Just an application of the ol' Pythagorean Theorem to get distance between
  // two points using lat/lng as x/y pairs.
  getDistance = function(pt1, pt2) {
    var width   = Math.abs(pt1.x - pt2.x),
        height  = Math.abs(pt1.y - pt2.y);

    return Math.sqrt(width*width + height*height);
  },

  // latlng1 and latlng2 are strings of format "-37.9234,122.9731"
  getGoogleDistance = function(latlng1, latlng2, callback) {
    var mapsPath     = '/maps/api/distancematrix/json?&sensor=false&units=imperial&origins='+latlng1+'&destinations='+latlng2,
        options      = { host: 'maps.googleapis.com',
                        path: mapsPath,
                        port: 80,
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                      },
        response = '',
        httpreq;
    httpreq = http.request(options, function(httpres) {
      httpres.on('data', function(chunk) {
        response += chunk;
      });
      httpres.on('end', function() {
        callback(response);
      });
    });
    httpreq.end();
  };

  this.listen = function(app) {
    app.get('/linkedinshuttle', function(req, res) {
      res.render('lishuttle', { layout: false });
    });

    app.get('/distanceproxy/:originlatlng/:destlatlng', function(req, res) {
      var params       = req.params,
          originlatlng = decodeURIComponent(params.originlatlng),
          destlatlng   = decodeURIComponent(params.destlatlng),
          wrapper = req.query['callback'] ? req.query['callback'] : 'callback';

      getGoogleDistance(originlatlng, destlatlng, function(data) {
        res.send(wrapper + '(' + data + ')');
      });
    });

    app.get('/closestdistance/:latlng', function(req, res) {
      var params      = req.params,
          latlng      = decodeURIComponent(params.latlng),
          commaIndex  = latlng.indexOf(','),
          lat         = latlng.substring(0, commaIndex),
          lng         = latlng.substring(commaIndex+1),
          closestStop = getClosestStop(parseFloat(lat),
                                       parseFloat(lng)),
          wrapper = req.query.callback ? req.query.callback : 'callback';

      res.send(wrapper + '(' + closestStop + ')');
      /*
      getGoogleDistance(latlng, closestStop.location.latitude+','+closestStop.location.longitude, function(data) {
        var jsonData = JSON.parse(data);
        jsonData.name = closestStop.name;
        res.send(wrapper + '(' + JSON.stringify(jsonData) + ')');
      });
      */
    });
  };
};

module.exports = new Shuttle();
