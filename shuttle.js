var http = require('http'),

Shuttle = function() {
  this.listen = function(app) {
    app.get('/linkedinshuttle', function(req, res) {
      res.render('lishuttle', { layout: false });
    });

    app.get('/shuttledistanceproxy/:path', function(req, res) {
      var params      = req.params,
          path        = decodeURIComponent(params.path),
          options     = { host: 'maps.googleapis.com',
                          path: path,
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
