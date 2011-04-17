var express = require('express'),
    sys = require('sys'),
    app = express.createServer(),
    dimSize = 30,
    stupidLoadStatuses = ['Plugging in computer...',
                          'Untangling cords...',
                          'Oiling gears...',
                          'Questioning the meaning of existence...',
                          'Searching for signs of life...',
                          'Changing batteries...'];

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
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

app.get('/404', function(req, res){
  throw new NotFound;
});
app.get('/500', function(req, res){
  throw new Error('keyboard cat!');
});
app.error(function(err, req, res, next){
  if (err instanceof NotFound) {
    res.render('404', {
      locals: {
        title: 'The page cannot be found',
        err: err
      },
      layout: 'errlayout'
    });
  } else {
    next(err);
  }
});
app.error(function(err, req, res){
  res.render('500', {
    locals: {
      title: 'Oops!',
      error: err
    },
    layout: 'errlayout'
  });
});

/*
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});
*/

// Routes

app.get('/', function(req, res){
  console.log('here');
  res.render('index', {
    locals: {
      page: 'index',
      title: 'Some Guy\'s Site'
    }
  });
});

app.get('/grid', function(req, res){
  res.render('grid', {
    locals: {
      page: 'grid',
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

app.get('/linkedin', function(req, res){
  res.render('linkedin', {
    locals: {
      title: 'LinkedIn Connections!',
      loadStatus: stupidLoadStatuses[Math.floor(Math.random()*stupidLoadStatuses.length)]
    },
    layout: false
  });
});

app.get('/*', function(req, res) {
  throw new NotFound;
});


// export app instance into the Routes module object
exports.app = app;
exports.dimSize = dimSize;
