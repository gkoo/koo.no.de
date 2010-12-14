// test
var http = require('http');

var s = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('hello world');
});
s.listen('8000');
