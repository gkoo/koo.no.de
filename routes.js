var express = require('express'),
    faceModule = require('./faces_module.js'),
    blog = require('./blog.js'),
    app = express.createServer(),
    dimSize = 30;

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

// Routes: Blog
// ------------
app.post('/blog-post', function(req, res) {
  if (req.xhr) {
    if (req.body && req.body.pw) {
      if (req.body.entry && blog.authenticate(req.body.pw)) {
        blog.post(req.body.title, req.body.entry, function(response) {
          res.send(response);
          console.log('[BLOG] Response: ' + response);
        });
      }
    }
  }
});

app.post('/blog-auth', function(req, res) {
  if (req.xhr) {
    if (req.body && req.body.pw) {
      res.send({
        success: blog.authenticate(req.body.pw)
      });
    }
  }
});

app.get('/blog-admin', function(req, res) {
  res.render('blog_admin', {
    locals: {
      page: 'blog',
      title: 'Blog Admin'
    }
  });
});

app.get('/blog', function(req, res) {
  // Fetch recent posts from Couch. When they
  // return, render them.
  var posts = blog.getRecentPosts(function(posts) {
    var cleanedPosts = [],
        rows = posts.rows,
        row, blogpost, i, len;

    for (i=0,len=rows.length; i<len; ++i) {
      row = rows[i].value;
      blogpost = {};

      blogpost.title      = row.title;
      blogpost.timestamp  = (new Date(row.timestamp)).toDateString();
      blogpost.post       = row.post;
      cleanedPosts.push(blogpost);
    }

    res.render('blog', {
      locals: {
        page: 'blog',
        title: 'My Blog',
        posts: cleanedPosts
      }
    });
  });
});

// Routes: Grid
// ------------
app.get('/grid', function(req, res){
  res.render('grid', {
    locals: {
      page: 'grid',
      dimSize: dimSize,
      title: 'Welcome to the Grid'
    }
  });
});

// Routes: Faces
// -------------
app.get('/facetoptitles', function(req, res){
  faceModule.getTopTitles(function(topTitles) {
    res.send({ topTitles: topTitles });
  });
});

app.post('/facecache-get', function(req, res){
  if (req.xhr) {
    faceModule.retrieveCached(req.body, function(attrs) {
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

// Routes: Index
// -------------
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
