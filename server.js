// test
var http = require('http');

var s = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('<h1>hello world</h1>');
});
s.listen('80');
