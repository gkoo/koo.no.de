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
  app.use(express.staticProvider(__dirname + '/public'));
  app.use(app.router); // IMPORTANT! keep this line last.
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

app.get('/500', function(req, res){
  throw new Error('keyboard cat!');
});
app.error(function(err, req, res, next){
  if (err instanceof NotFound) {
    console.log('doing 404');
    res.render('404.jade', {
      locals: {
        title: 'Oops!',
        err: err
      }
    });
  } else {
    console.log('next');
    next(err);
  }
});
app.error(function(err, req, res){
  res.render('500', {
    locals: {
      title: 'Oops!',
      error: err
    }
  });
});

/*
app.configure('development', function(){
  //app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  //app.use(express.errorHandler());
});

app.configure('production', function(){
  app.use(express.errorHandler());
});
*/

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

app.get('/*', function(req, res) {
  throw new NotFound;
});


// export app instance into the Routes module object
exports.app = app;
exports.dimSize = dimSize;
