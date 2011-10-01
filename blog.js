/* Defines helper functions for blog operations. */

// TODO: create a label for drafts
// TODO: editing an existing post will actually update the doc and not create a new post
// TODO: add more formatting. bold, italic, underline, lists
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
                    port: 80,
                    method: 'GET',
                    headers: { 'Authorization': 'Basic a29vbm9kZTpDYXlnb25nQmxvZzg2Kg==',
                               'Content-Type': 'application/json' },
                  },
        response = '',
        data = opt ? opt.data : null,
        req, prop;

    // '/blog/' for posting, everything else for reading
    if (opt.view) {
      options.path = '/blog/_design/blogposts/_view/' + opt.view + '?';
    }
    else if (opt.id) {
      options.path = '/blog/' + opt.id;
    }
    else {
      options.path = '/blog/';
    }

    for (prop in opt) {
      if (prop != 'view' && prop != 'data' && prop != 'id') {
        options.path += prop + '=' + opt[prop] + '&';
      }
    }

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
      length = match[0].length; // original substring length
      index = match.index;
      str = [str.substring(0, index), linkHtml, str.substring(index+length)].join('');
      match = link_re.exec(str);
    }
    return str;
  },

  unformatLinks = function(str) {
    //var link_re = /\[([^\]]+)\]\(([^\)]+)\)/g,
    var link_re = /<a href="([^"]+)">([^<]+)<\/a>/g,
        match,
        linkUrl,
        linkText,
        formattedStr,
        length,
        index;

    // format links
    match = link_re.exec(str);
    while (match) {
      linkText = match[2];
      linkUrl = match[1];
      formattedStr = ['[', linkText, '](', linkUrl, ')'].join('');
      length = match[0].length; // original substring length
      index = match.index;
      str = [str.substring(0, index), formattedStr, str.substring(index+length)].join('');
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
      length = match[0].length; // original substring length
      index = match.index;
      str = [str.substring(0, index), imgHtml, str.substring(index+length)].join('');
      match = img_re.exec(str);
    }
    return str;
  },

  unformatImages = function(str) {
    var img_re = /<img src="([^"]+)"\/>/g,
        match,
        imgSrc,
        formattedImgStr,
        length,
        index;

    // format links
    match = img_re.exec(str);
    while (match) {
      imgSrc = match[1];
      formattedImgStr = ['[img:', imgSrc, ']'].join('');
      length = match[0].length; // + 6 for [img:] -- length of the substring to replace
      index = match.index;
      str = [str.substring(0, index), formattedImgStr, str.substring(index+length)].join('');
      match = img_re.exec(str);
    }
    return str;
  },

  processPostInput = function(str) {
    str = str.replace(/\n\n+/g, '\n\n')
             .replace('<', '&lt;')
             .replace('>', '&gt;');
             //.replace(/\[[biu]\]/g, '<b>');

    str = formatLinks(str);
    str = formatImages(str);

    str = str.split('\n\n');
    for (i=0, len=str.length; i<len; ++i) {
      str[i] = '<p>' + str[i].replace('\n', '<br/>') + '</p>';
    }

    return str.join('');
  },

  unprocessPostInput = function(str) {
    str = str.replace('&lt;', '<')
              .replace('&gt;', '<')
              .replace(/<p>/g, '')
              .replace(/<\/p>/g, '\n\n');
    str = unformatLinks(str);
    str = unformatImages(str);
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

  this.post = function(title, post, callback, isDraft) {
    var paras, i, len;

    post = processPostInput(post);

    couchRequest({ data: { 'title':     title,
                           'post':      post,
                           'slug':      slugify(title),
                           'status':    isDraft ? 'draft' : 'published',
                           'timestamp': (new Date()).getTime(),
                           'type':      'blogpost'
                         },
                 }, callback);
  };

  this.getPostById = function(id, callback) {
    couchRequest({ 'id': id }, callback);
  };

  this.getPosts = function(options, response) {
    var path = '/blog/_design/blogposts/_view/',
        opt = {},
        rowsPerPage = 5,
        limit       = typeof options.limit !== 'undefined' ? options.limit : 0;

    if (typeof options.slug !== 'undefined') {
      opt.view = 'blogslugs';
      opt.key = options.slug;
      if (limit) {
        opt.limit = limit;
      }
    } else {
      opt.view = 'blogposts';
      opt.descending = true;
      opt.limit = 5;
      opt.page = 0;
    }

    couchRequest(opt, function(posts) {
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

  this.getPostList = function(options, callback) {
    var view = '/blog/_design/blogposts/_view/blogposts?descending=true',
        limit = options.limit ? options.limit : undefined,
        row, date, blogpost;

    couchRequest({ view: 'blogposts', descending: true, limit: limit }, function(posts) {
      var postSummaries = [],
          rows = posts.rows;
      if (posts && typeof posts.error !== 'undefined') {
        console.log('[COUCH]: ' + posts);
        return;
      }
      for (i=0,len=rows.length; i<len; ++i) {
        row = rows[i].value;

        blogpost        = {};
        blogpost.title  = row.title;
        blogpost.date   = row.timestamp;
        blogpost.id     = rows[i].id;
        blogpost.slug   = row.slug;
        blogpost.status = row.status;
        postSummaries.push(blogpost);
      }
      callback(postSummaries);
    });
  };

  // handle blog-specific routes
  this.listen = function(app) {
    var _this = this;

    app.post('/blog-post', function(req, res) {
      if (req.xhr && req.body && req.body.pw) {
        if (req.body.entry && _this.authenticate(req.body.pw)) {
          _this.post(req.body.title, req.body.entry, function(response) {
            res.send(response);
            console.log('[BLOG] Response: ' + JSON.stringify(response));
          }, req.body.isDraft && req.body.isDraft === 'true');
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
      _this.getPostList({ limit: 10 }, function(posts) {
        res.render('blog_admin', {
          locals: {
            page: 'blog',
            posts: posts,
            title: 'Blog Admin'
          }
        });
      });
    });

    app.get('/blog/:year/:month/:title', function(req, res) {
      // Fetch specific blog post by title slug
      _this.getPosts({ slug: req.params['title'],
                      year: req.params['year'],
                      month: req.params['month'] }, res);
    });

    app.get('/blog/:id', function(req, res) {
      _this.getPostById(req.params['id'], function(data) {
        data.post = unprocessPostInput(data.post);
        res.send(data);
      });
    });

    // Deprecated
    app.get('/blog/:title', function(req, res) {
      // Fetch specific blog post by title slug
      _this.getPosts({ slug: req.params['title'] }, res);
    });

    app.get('/blog', function(req, res) {
      // Fetch recent posts from Couch. When they
      // return, render them.
      _this.getPosts({ page: 0, limit: 5 }, res);
    });
  };
};

module.exports = new Blog();
