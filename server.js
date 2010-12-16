
/**
 * Module dependencies.
 */

var express = require('express');

var io = require('socket.io');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Gordon\'s Website'
    }
  });
});

app.get('/blog', function(req, res){
  res.render('blog', {
    locals: {
      title: 'Blog'
    }
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(8080);
  console.log("Express server listening on port %d", app.address().port)
}

var io = io.listen(app),
    buffer = [];

io.on('connection', function(client) {
  client.send({ buffer: buffer });
  client.broadcast({ announcement: client.sessionId + ' connected' });

  client.on('message', function(message) {
    var msg = { message: [client.sessionId, message] };
    buffer.push(msg);
    if (buffer.length > 15) { buffer.shift(); }
    client.broadcast(msg);
    // why doesn't broadcast send message to original sender?
  });

  client.on('disconnect', function(message) {
    client.broadcast({ announcement: client.sessionId + ' disconnected'});
  });
});
