var express = require('express'),
    faceModule = require('./faces_module.js'),
    blog = require('./blog.js'),
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



// Routes: Drawer
// --------------
app.get('/drawer', function(req, res){
  var experiences = [
    { company: 'LinkedIn',
      dates: '9/2010 &mdash; present',
      positionTitle: 'Software Engineer/Web Developer',
      description: '<p>I am playing with cool things like Hadoop, Pig, and <a href="http://project-voldemort.com/" target="_blank">Voldemort</a> to build data-driven products. Currently, I am working on adding features to and improving Who’s Viewed My Profile. From September \'10 to June \'11, I was part of the web development team, working on improving the experience of job seekers and job posters on LinkedIn. I also made contributions to the Javascript team.</p>' },
    { company: 'ChoiceVendor',
      dates: '11/2009 &mdash; 9/2010',
      positionTitle: 'Software Engineer',
      description: '<p>My work on the ChoiceVendor website involved responsibilities ranging from the business logic to the presentation level of the application. I worked on developing the application logic, which was written in Python using the Django framework. On the front end, I created the Jinja2 templates and the CSS and Javascript that accompanied them.</p><p>ChoiceVendor was acquired by LinkedIn in September 2010.</p>' },
    { company: 'Oracle',
      dates: '9/2008 &mdash; 11/2009',
      positionTitle: 'Applications Engineer',
      description: '<p>I worked on prototypes for Oracle\'s E-Business Suite, an enterprise software solution, gaining experience in Adobe Flex and Adobe Air.</p>' }
  ],

  projects = [
    { name: 'Hero Connect',
      url: 'http://heroconnect.linkedinlabs.com',
      dates: '11/2011',
      description: '<p>LinkedIn hosted a public-facing Veteran\'s Day Hackday in November 2011. <a href="http://veterans2011.linkedin.com/#gallery/11" target="_blank">My team\'s submission</a> was Hero Connect, a web application which recommends companies who have recently hired veterans and makes it easy to connect with veterans at those companies.</p>'
    },
    { name: 'Faces of LinkedIn',
      url: 'http://koo.no.de/faces',
           dates: '7/2011',
           description: '<p>A mashup of the Face.com API and LinkedIn\'s Javascript API. Take your LinkedIn connections and filter them by who\'s happy, who\'s angry, who wears glasses, and more. Winner of LinkedIn\'s July Hackday.</p>'
    },
    { name: 'LinkedIn Connection Timeline',
      url: 'http://timeline.linkedinlabs.com',
      dates: '4/2011 &mdash; 5/2011',
      description: '<p>The Connection Timeline is an interactive visualization of the LinkedIn connections you\'ve made throughout your career.</p>'
    },
    { name: 'Grid',
      url: 'http://www.gordonkoo.com/grid',
      dates: '12/2010',
      description: '<p>My first foray into real-time applications using NodeJS and Socket.IO. It\'s best described as a collaborative drawing experience and worst described as an unfinished thing that lets you draw on one browser and see it happen on a different browser.</p>'
    }
  ];

  res.render('drawer', {
    locals: {
      page: 'drawer',
      experiences: experiences,
      projects: projects,
      title: 'Android Drawer Demo'
    },
    layout: 'layout2'
  });
});

// Routes: Blog
// ------------
blog.listen(app);

// Routes: Resume
// --------------
resume.listen(app);

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
