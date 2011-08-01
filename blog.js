/* Defines helper functions for blog operations. */

var http = require('http'),

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

  processPostInput = function(str) {
    var link_re = /\[([^\]]+)\]\(([^\)]+)\)/g,
        match,
        linkUrl,
        linkText,
        linkHtml,
        length,
        index;

    str = str.replace(/\n\n+/g, '\n\n')
             .replace('<', '&lt;')
             .replace('>', '&gt;');

    match = link_re.exec(str);

    while (match) {
      linkUrl = match[2];
      linkText = match[1];
      linkHtml = ['<a href="', linkUrl, '">', linkText, '</a>'].join('');
      length = linkUrl.length + linkText.length + 4; // + 4 for []()
      index = match.index;
      str = [str.substring(0, index), linkHtml, str.substring(index+length)].join('');
      console.log(str);
      match = link_re.exec(str);
    }
    return str;
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
                           'timestamp': (new Date()).getTime(),
                           'type':      'blogpost'
                         },
                 }, callback);
  };

  this.getRecentPosts = function(callback) {
    couchRequest({ path: '/blog/_design/blogposts/_view/blogposts?descending=true' }, callback);
  };
};

module.exports = new Blog();
