/* Defines helper functions for blog operations. */

// TODO: update UI after deleting post
// TODO: view draft in admin interface

var http = require('http'),

Blog = function() {
  var couchRequest = function(opt, callback) {
    var options = { host: 'gkoo.iriscouch.com',
                    port: 80,
                    method: opt.method ? opt.method : 'GET',
                    headers: { 'Authorization': 'Basic a29vbm9kZTpDYXlnb25nQmxvZzg2Kg==',
                               'Content-Type': 'application/json' },
                  },
        response = '',
        data = opt ? opt.data : null,
        req, prop;

    options.path = '/blog/';

    // '/blog/' for posting, everything else for reading
    if (opt.view) {
      options.path = '/blog/_design/blogposts/_view/' + opt.view + '?';
    }
    else if (opt.id) {
      options.path = '/blog/' + opt.id;
    }

    if (opt.method && opt.method === 'DELETE') {
      if (!opt.id || !opt.rev) {
        console.log('[BLOG] Missing id or rev.');
      }
      else {
        options.path = '/blog/' + opt.id + '?rev=' + opt.rev;
      }
    }

    if (opt.urlOpt) {
      for (prop in opt.urlOpt) {
        options.path += prop + '=' + opt.urlOpt[prop] + '&';
      }
    }

    if (data) {
      // it's a POST/PUT
      options.method = opt.method ? opt.method : 'POST';
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

  createDateString = function(timestamp) {
    var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        date      = new Date(timestamp);

    return [WEEKDAYS[date.getDay()], MONTHS[date.getMonth()], date.getDate() + ',', date.getFullYear()].join(' ');
  },

  formatTextDecoration = function(str) {
    // formats bold, italic, underline
    var td_re = /\[([u|i|b])\]([^\[]+)\[\/([u|i|b])\]/g,
        bq_re,
        match,
        strText,
        strTag,
        strHtml,
        length,
        index;

    // format text decoration
    match = td_re.exec(str);
    while (match) {
      strTag = match[1];
      strText = match[2];
      strHtml = ['<', strTag, '>', strText, '</' + strTag + '>'].join('');
      length = match[0].length; // original substring length
      index = match.index;
      str = [str.substring(0, index), strHtml, str.substring(index+length)].join('');
      match = td_re.exec(str);
    }

    // blockquote
    bq_re = /\[blockquote\]/g;
    str = str.replace(bq_re, '<div class="blockquote">');
    bq_re = /\[\/blockquote\]/g;
    str = str.replace(bq_re, '</div>');

    return str;
  },

  unformatTextDecoration = function(str) {
    var re = /<u>/g;
    str = str.replace(re, '[u]');
    re = /<\/u>/g;
    str = str.replace(re, '[/u]');

    re = /<b>/g;
    str = str.replace(re, '[b]');
    re = /<\/b>/g;
    str = str.replace(re, '[/b]');

    re = /<i>/g;
    str = str.replace(re, '[i]');
    re = /<\/i>/g;
    str = str.replace(re, '[/i]');

    re = /<div class="blockquote">/g;
    str = str.replace(re, '[blockquote]');
    re = /<\/div>/g;
    str = str.replace(re, '[/blockquote]');

    return str;
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
        match   = link_re.exec(str),
        linkUrl,
        linkText,
        formattedStr,
        length,
        index;

    // format links
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
    str = formatTextDecoration(str);

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
              .replace(/<\/p>/g, '\n\n')
              .replace(/<br\/>/g, '\n');
    str = unformatLinks(str);
    str = unformatImages(str);
    str = unformatTextDecoration(str);
    return str;
  },

  // from http://milesj.me/snippets/javascript/slugify
  slugify = function(text) {
    text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
    text = text.replace(/-/gi, "_");
    text = text.replace(/\s/gi, "-");
    return text;
  },

  MAX_POSTS_PER_PAGE = 5;

  this.authenticate = function(pw) {
    if (pw === 'BungngacheeSikgausee&') {
      return 1;
    }
    return 0;
  };

  this.publish = function(o, callback) {
    var method = o.id ? 'PUT' : 'POST',
        data   = { 'title':     o.title,
                   'slug':      slugify(o.title),
                   'status':    o.isDraft ? 'draft' : 'published',
                   'type':      'blogpost',
                   '_rev':      o.rev
                 },
        paras, i, len;

    if (o.time) {
      console.log(o.time);
      data.timestamp = parseInt(o.time, 10);
    }
    else {
      console.log('new time');
      // don't update the date if it's an existing document
      console.log('updating timestamp');
      data.timestamp = (new Date()).getTime();
    }
    data.post = processPostInput(o.entry);

    couchRequest({ 'data':   data,
                   'id':     o.id,
                   'method': method
                 }, callback);
  };

  this.cleanPosts = function(posts) {
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
    return cleanedPosts;
  },

  this.getPostById = function(id, callback) {
    couchRequest({ 'id': id }, callback);
  };

  this.getPostByTitle = function(title, callback) {
    couchRequest({
                   'view': 'blogslugs',
                   'urlOpt': { 'key': '"' + title + '"' }
                 },
                 callback);
  };

  // used for getting posts for the main blog page
  this.getPosts = function(options, callback) {
    var opt         = { urlOpt: options },
        limit       = typeof options.limit !== 'undefined' ? options.limit : MAX_POSTS_PER_PAGE,
        _this = this;

    opt.view = 'blogposts';
    if (typeof opt.urlOpt.descending === 'undefined') {
      opt.urlOpt.descending = true;
    }
    if (limit) {
      opt.urlOpt.limit = limit + 1;
    }
    if (options.startkey) {
      opt.urlOpt.startkey = options.startkey;
    }

    couchRequest(opt, function(posts) {
      var rows,
          nextLink = '',
          prevLink = '',
          hasNext = false,
          hasPrev = false,
          numPosts = 0;

      if (opt.urlOpt.descending) {
        // Going forwards (in terms of pages)

        // don't count the skipped row
        numPosts = posts.rows.length < opt.urlOpt.limit ? posts.rows.length : posts.rows.length - 1;
        if ((posts.offset + numPosts) < posts.total_rows) {
          hasNext = true;
        }
        if (posts.offset) {
          hasPrev = true;
        }
      }
      else {
        // Going backwards (in terms of pages)
        if (posts && posts.rows) {
          // need to reverse order of rows
          posts.rows.reverse();
        }
        if ((posts.offset + posts.rows.length) < posts.total_rows) {
          hasPrev = true;
        }
        if (posts.offset) {
          hasNext = true;
        }
      }

      rows = posts.rows;

      if (hasNext) {
        // has next
        // TODO: fix this link!
        nextLink = '/blog/next/' + rows[rows.length-1].key;
      }
      if (hasPrev) {
        // has prev
        prevLink = '/blog/prev/' + rows[0].key;
      }
      if (rows.length > limit) {
        // only use last row as a pointer for Next Page link
        posts.rows = rows.slice(0, rows.length-1);
      }
      callback({ posts:    _this.cleanPosts(posts),
                 nextLink: nextLink,
                 prevLink: prevLink });
    });
  };

  this.getPostList = function(options, callback) {
    var opt = { view: 'blogposts_all',
                urlOpt: { descending: true,
                          limit: options.limit ? options.limit : undefined }
              };

    couchRequest(opt, function(posts) {
      var postSummaries = [],
          rows = posts.rows,
          row, date, blogpost;
      if (posts && typeof posts.error !== 'undefined') {
        console.log('[COUCH]: ' + posts);
        return;
      }
      for (i=0,len=rows.length; i<len; ++i) {
        row = rows[i].value;

        blogpost        = {};
        blogpost.title  = row.title;
        blogpost.date   = row.timestamp;
        blogpost.id     = row._id;
        blogpost.rev    = row._rev;
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

    app.post('/blog-publish', function(req, res) {
      if (req.xhr && req.body && req.body.pw) {
        if (req.body.entry && _this.authenticate(req.body.pw)) {
          var data = {
            id:      req.body.id,
            rev:     req.body.rev,
            title:   req.body.title,
            entry:   req.body.entry,
            time:    req.body.timestamp,
            isDraft: req.body.isDraft && req.body.isDraft === 'true',
          };

          _this.publish(data,
                        function(response) {
                          res.send(response);
                          console.log('[BLOG] Response: ' + JSON.stringify(response));
                        }
          );

        }
      }
    });

    app.post('/blog-delete-post', function(req, res) {
      if (req.xhr && req.body && req.body.pw) {
        if (req.body.id && req.body.rev && _this.authenticate(req.body.pw)) {
          couchRequest({ 'id': req.body.id,
                         'rev': req.body.rev,
                         'method': 'DELETE' },
                       function(data) {
                         res.send(data);
                       });
          return;

          // delete.

        }
      }
      res.send({ 'status': 'error' });
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

    /*
    app.get('/blog/:year/:month/:title', function(req, res) {
      // Fetch specific blog post by title slug
      _this.getPosts({ slug:  req.params['title'],
                       year:  req.params['year'],
                       month: req.params['month'] }, res);
    });
    */

    app.get('/blog/id/:id', function(req, res) {
      _this.getPostById(req.params['id'], function(data) {
        data.post = unprocessPostInput(data.post);
        res.send(data);
      });
    });

    // Deprecated
    app.get('/blog/title/:title', function(req, res) {
      // Fetch specific blog post by title slug
      _this.getPostByTitle(req.params['title'], function(data) {
        var cleanedPost = _this.cleanPosts(data);
        res.render('blog', {
          locals: {
            page: 'blog',
            title: 'My Blog',
            posts: cleanedPost,
            nextLink: '',
            prevLink: ''
          }
        });
      });
    });

    app.get('/blog/prev/:end', function(req, res) {
      _this.getPosts({
        startkey: req.params['end'],
        descending: false,
      }, function(data) {
        res.render('blog', {
          locals: {
            page:     'blog',
            title:    'My Blog',
            posts:    data.posts,
            nextLink: data.nextLink,
            prevLink: data.prevLink
          }
        });
      });
    });

    app.get('/blog/next/:start', function(req, res) {
      _this.getPosts({
        startkey: req.params['start']
      }, function(data) {
        res.render('blog', {
          locals: {
            page:     'blog',
            title:    'My Blog',
            posts:    data.posts,
            nextLink: data.nextLink,
            prevLink: data.prevLink
          }
        });
      });
    });

    app.get('/blog', function(req, res) {
      // Fetch recent posts from Couch. When they
      // return, render them.
      _this.getPosts({}, function(data) {
        res.render('blog', {
          locals: {
            page:     'blog',
            title:    'My Blog',
            posts:    data.posts,
            nextLink: data.nextLink,
            prevLink: data.prevLink
          }
        });
      });
    });
  };
};

module.exports = new Blog();
