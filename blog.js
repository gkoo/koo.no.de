/* Defines helper functions for blog operations. */

var http = require('http'),

createDateString = function(timestamp) {
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      date      = new Date(timestamp);

  return [WEEKDAYS[date.getDay()], MONTHS[date.getMonth()], date.getDate() + ',', date.getFullYear()].join(' ');
},

Blog = function() {
  var couchRequest = function(opt, callback) {
    var options = { host: 'gkoo.iriscouch.com',
                    path: opt.path ? opt.path : '/blog/',
                    port: 80,
                    method: 'GET',
                    headers: { 'Authorization': 'Basic a29vbm9kZTpDYXlnb25nQmxvZzg2Kg==',
                               'Content-Type': 'application/json' },
                  },
        response = '',
        data = opt ? opt.data : null,
        req;

    if (data) {
      // it's a POST
      options.method = 'POST';
    }
    req = http.request(options, function(res) {
      res.on('data', function(chunk) {
        response += chunk;
      });
      res.on('end', function() {
        callback(JSON.parse(response));
      });
    });

    // if this is a POST, fill the request body with the POST data.
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  },

  formatLinks = function(str) {
    var link_re = /\[([^\]]+)\]\(([^\)]+)\)/g,
        match,
        linkUrl,
        linkText,
        linkHtml,
        length,
        index;

    // format links
    match = link_re.exec(str);
    while (match) {
      linkUrl = match[2];
      linkText = match[1];
      linkHtml = ['<a href="', linkUrl, '">', linkText, '</a>'].join('');
      length = linkUrl.length + linkText.length + 4; // + 4 for []()
      index = match.index;
      str = [str.substring(0, index), linkHtml, str.substring(index+length)].join('');
      match = link_re.exec(str);
    }
    return str;
  },

  formatImages = function(str) {
    var img_re = /\[img:([^\]]+)]/g,
        match,
        imgSrc,
        imgHtml,
        length,
        index;

    // format links
    match = img_re.exec(str);
    while (match) {
      imgSrc = match[1];
      imgHtml = ['<img src="', imgSrc, '"/>'].join('');
      length = imgSrc.length + 6; // + 6 for [img:] -- length of the substring to replace
      index = match.index;
      str = [str.substring(0, index), imgHtml, str.substring(index+length)].join('');
      match = img_re.exec(str);
    }
    return str;
  },

  processPostInput = function(str) {

    str = str.replace(/\n\n+/g, '\n\n')
             .replace('<', '&lt;')
             .replace('>', '&gt;');

    str = formatLinks(str);
    str = formatImages(str);

    return str;
  },

  // from http://milesj.me/snippets/javascript/slugify
  slugify = function(text) {
    text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
    text = text.replace(/-/gi, "_");
    text = text.replace(/\s/gi, "-");
    return text;
  };

  this.authenticate = function(pw) {
    if (pw === 'BungngacheeSikgausee&') {
      return 1;
    }
    return 0;
  };

  this.post = function(title, post, callback) {
    var paras, i, len;

    post = processPostInput(post);

    paras = post.split('\n\n');
    for (i=0, len=paras.length; i<len; ++i) {
      paras[i] = '<p>' + paras[i].replace('\n', '<br/>') + '</p>';
    }
    paraStr = paras.join('');
    couchRequest({ data: { 'title':     title,
                           'post':      paraStr,
                           'slug':      slugify(title),
                           'timestamp': (new Date()).getTime(),
                           'type':      'blogpost'
                         },
                 }, callback);
  };

  this.getPosts = function(options, response) {
    var path = '/blog/_design/blogposts/_view/';

    if (typeof options.page !== 'undefined') {
      path += 'blogposts?descending=true&limit=5&page=' + options.page;
    } else if (typeof options.slug !== 'undefined') {
      path += 'blogslugs?limit=1&key="' + options.slug + '"';
    }

    couchRequest({ path: path }, function(posts) {
      var cleanedPosts = [],
          rows = posts.rows,
          row, blogpost, i, len, date;

      if (posts && typeof posts.error !== 'undefined') {
        console.log('[COUCH]: ' + posts);
        return;
      }
      for (i=0,len=rows.length; i<len; ++i) {
        row       = rows[i].value;
        date      = new Date(row.timestamp);
        blogpost  = {};

        blogpost.title      = row.title;
        blogpost.timestamp  = createDateString(row.timestamp);
        blogpost.year       = date.getFullYear();
        blogpost.month      = date.getMonth() + 1;
        blogpost.post       = row.post;
        blogpost.slug       = row.slug;
        cleanedPosts.push(blogpost);
      }

      response.render('blog', {
        locals: {
          page: 'blog',
          title: 'My Blog',
          posts: cleanedPosts
        }
      });
    });
  };

  // handle blog-specific routes
  this.listen = function(app) {
    var _this = this;

    app.post('/blog-post', function(req, res) {
      if (req.xhr) {
        if (req.body && req.body.pw) {
          if (req.body.entry && _this.authenticate(req.body.pw)) {
            _this.post(req.body.title, req.body.entry, function(response) {
              res.send(response);
              console.log('[BLOG] Response: ' + JSON.stringify(response));
            });
          }
        }
      }
    });

    app.post('/blog-auth', function(req, res) {
      if (req.xhr) {
        if (req.body && req.body.pw) {
          res.send({
            success: _this.authenticate(req.body.pw)
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

    app.get('/blog/:year/:month/:title', function(req, res) {
      // Fetch specific blog post by title slug
      _this.getPosts({ slug: req.params['title'],
                      year: req.params['year'],
                      month: req.params['month'] }, res);
    });

    // Deprecated
    app.get('/blog/:title', function(req, res) {
      // Fetch specific blog post by title slug
      _this.getPosts({ slug: req.params['title'] }, res);
    });

    app.get('/blog', function(req, res) {
      // Fetch recent posts from Couch. When they
      // return, render them.
      _this.getPosts({ page: 0 }, res);
    });
  };
};

module.exports = new Blog();
