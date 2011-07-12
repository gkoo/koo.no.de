var express = require('express'),
    //sys = require('sys'),
    //fs = require('fs'),
    app = express.createServer(),
    dimSize = 30,
    //logStream = fs.createWriteStream('./request.log', { flags: 'a' }),
    stupidLoadStatuses = ['Plugging in computer...',
                          'Untangling cords...',
                          'Oiling gears...',
                          'Pondering the meaning of existence...',
                          'Please insert floppy disk...',
                          'Doing some spring cleaning...',
                          'Changing batteries...'];

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  //app.use(express.logger({ stream: logStream }));
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

//sys.inherits(NotFound, Error);

app.get('/404', function(req, res){
  throw new NotFound;
});
app.get('/500', function(req, res){
  throw new Error('keyboard cat!');
});
app.error(function(err, req, res, next){
  console.log(err);
  if (err instanceof NotFound) {
    res.render('404', {
      locals: {
        title: 'The ol\' 404',
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

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/grid', function(req, res){
  res.render('grid', {
    locals: {
      page: 'grid',
      dimSize: dimSize,
      title: 'Welcome to the Grid'
    }
  });
});

app.get('/face', function(req, res){
  res.render('face', {
    locals: {
      page: 'face',
      title: 'Faces Of Your LinkedIn Network',
    },
    layout: 'facelayout'
  });
});

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      page: 'index',
      title: 'designed by an engineer'
    }
  });
});

/*
app.get('/*', function(req, res) {
  throw new NotFound;
});
*/


// export app instance into the Routes module object
exports.app = app;
exports.dimSize = dimSize;
