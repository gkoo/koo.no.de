var express = require('express'),
    face = require('./faces_module.js'),
    //blog = require('./blog.js'),
    resume = require('./resume.js'),
    shuttle = require('./shuttle.js'),
    app = express.createServer(),
    dimSize = 30;

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.enable('jsonp callback');
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
// ======

// Routes: LinkedIn Shuttle Tracker
// --------------------------------
shuttle.listen(app);

// Routes: WVMX Notifications
// --------------------------
app.get('/wvmx/:name/:profileurl?/:pictureurl?', function(req, res) {
  var params      = req.params,
      name        = decodeURIComponent(params.name),
      profileUrl,
      pictureUrl;

  profileUrl = params.profileurl ? decodeURIComponent(params.profileurl) : 'http://www.linkedin.com/wvmx/profile',
  pictureUrl = params.pictureurl ? decodeURIComponent(params.pictureurl) : 'http://static02.linkedin.com/scds/common/u/img/icon/icon_no_photo_40x40.png',

  res.render('wvmx', {
    locals: {
      'name':       name,
      'profileUrl': profileUrl,
      'pictureUrl': pictureUrl,
    },
    layout: false
  });;
});




// Routes: Blog
// ------------
//blog.listen(app);

// Routes: Grid
// ------------
app.get('/grid', function(req, res){
  res.render('grid', {
    locals: {
      page: 'grid',
      dimSize: dimSize,
      title: 'Welcome to the Grid'
    },
    layout: false
  });
});

// Routes: Faces
// -------------
app.get('/facetoptitles', function(req, res){
  face.getTopTitles(function(topTitles) {
    res.send({ topTitles: topTitles });
  });
});

app.post('/facecache-get', function(req, res){
  if (req.xhr) {
    face.retrieveCached(req.body, function(attrs) {
      res.send({ attrs: attrs });
    });
  }
});

app.get('/faces', function(req, res){
  res.render('faces', {
    locals: {
      page: 'faces'
    },
    layout: 'faceslayout'
  });
});

// Routes: Drawer
// --------------
app.get('/drawer', function(req, res){
  res.render('drawer', {
    locals: {
      experiences: resume.experiences,
      projects: resume.projects,
      title: 'Gordon Koo',
      page: 'drawer'
    },
    layout: 'drawer_layout'
  });
});

app.get('/about', function(req, res){
  res.render('index', {
    locals: {
      title: 'Gordon Koo',
      page: 'about'
    },
    layout: false
  });
});

app.get('/blog', function(req, res){
  res.render('index', {
    locals: {
      title: 'Gordon Koo',
      page: 'blog'
    },
    layout: false
  });
});

app.get('/projects', function(req, res){
  res.render('index', {
    locals: {
      title: 'Gordon Koo',
      page: 'projects'
    },
    layout: false
  });
});

app.get('/misc', function(req, res){
  res.render('index', {
    locals: {
      title: 'Gordon Koo',
      page: 'misc'
    },
    layout: false
  });
});

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Gordon Koo',
      page: 'home'
    },
    layout: false
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
