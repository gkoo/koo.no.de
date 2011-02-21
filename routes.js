var express = require('express'),
    sys = require('sys'),
    app = express.createServer(),
    dimSize = 30;

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
  //app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  //app.use(express.errorHandler());
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
      dimSize: dimSize,
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


/* ==============
 * ERROR HANDLING
 * ==============
 */
function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(NotFound, Error);

app.get('/404', function(req, res){
  throw new NotFound;
});

app.get('/500', function(req, res){
  throw new Error('keyboard cat!');
});
app.error(function(err, req, res, next){
  sys.puts('APP.ERROR: ' + sys.inspect(err));
  res.render('500', {
    locals: {
      title: 'Oops!',
      error: err
    }
  });
//  if (err instanceof NotFound) {
//    res.render('404.jade');
//  } else {
//    next(err);
//  }
});
app.error(function(err, req, res){
  res.render('500.jade', {
    locals: {
     error: err
    }
  });
});


// export app instance into the Routes module object
exports.app = app;
exports.dimSize = dimSize;
