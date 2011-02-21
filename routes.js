var express = require('express');
    app = express.createServer();

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
      title: 'Some Guy\'s Site'
    }
  });
});

app.get('/grid', function(req, res){
  res.render('grid', {
    locals: {
      dimSize: 30,
      title: 'Welcome to the Grid'
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

// export app instance into the Routes module object
exports.app = app;
