var http    = require('http'), // used for posterous api
    express = require('express'),
    face  = require('./faces_module.js'),
    //blog  = require('./blog.js'),
    resume  = require('./resume.js'),
    shuttle = require('./shuttle.js'),
    app     = express.createServer(),
    renderHomepageResponse;

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

// Routes: Homepage
// ----------------
renderHomepageResponse = function (page, res, next) {
  var blogPosts,
      options,
      respBody;

  // Retrieve Posterous posts to render in Jade.
  if (page === 'grid') {
    next();
    return;
  }
  if (page === 'blog') {
    options = {
      host: 'www.posterous.com',
      path: '/api/2/sites/6512834/posts/public',
      port: 80
    };
    respBody = '';
    http.get(options, function (postRes) {
      postRes.on('data', function(chunk) {
        respBody += chunk;
      });
      postRes.on('end', function() {
        res.render('index', {
          locals: {
            title: 'Gordon Koo',
            page: 'blog',
            blogPosts: JSON.parse(respBody)
          },
          layout: false
        });
      });
    }).on('error', function (e) {
      console.log("Got error: " + e.message);
    });
  }
  // Otherwise, just render a normal section page.
  else {
    res.render('index', {
      locals: {
        title: 'Gordon Koo',
        page: page
      },
      layout: false
    });
  }
};

app.get(/^\/(\w+)\/?$/, function(req, res, next){
  var page = req.params[0];
  renderHomepageResponse(page, res, next);
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
