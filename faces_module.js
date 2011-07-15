var redis   = require('redis').createClient(),
    face    = require('./face_api_client.js'),

handlePhotoAttributes = function(response) {
  console.log(response);
},

handleCacheResults = function(err, res) {
},

FaceClient = function(key, secret) {

  var _this = this;

  this.handleFaceResult = function(result) {
    // TODO: cache in redis.
    // TODO: send to browser
    console.log(result);
  };

  this.handleCachedAttributes = function(err, response) {
    var i = 0,
        len = response.length,
        nullAttrUrls = [], // array of picture urls with no cached info
        urlBuffer = [],
        MAX_DETECT = 30,
        result = {}, // what we send back to browser.
        attrs,
        start,
        end,
        id;     // linkedin profile id

    console.log('============== IN handleCachedAttributes ==============');
    for (; i<len; ++i) {
      id = _this.profiles[i].id;
      attrs = response[i];
      result[id] = attrs;
      if (!attrs) {
        // if no cached result, add to array to request from face.com
        nullAttrUrls.push(_this.profiles[i].pictureUrl);
      }
    }
    len = nullAttrUrls.length;
    console.log(['LOG:', len, 'urls with no attributes'].join(' '));
    start = 0;
    // fetch non-cached picture attriubtes from face.com
    while(start < len) {
      end = start + MAX_DETECT < len ? start+MAX_DETECT : len;
      face.detect(nullAttrUrls.slice(start, end), _this.handleFaceResult, { attributes: 'glasses,mood,face,smiling' });
      start = end;
    }
  };

  this.retrieveCached = function(data, callback) {
    var urls     = [],
        i        = 0,
        profile;

    this.profiles = data.profiles;
    this.retrieveCallback = callback;

    for (idx in this.profiles) {
      urls.push(this.profiles[idx].pictureUrl);
    }

    redis.mget(urls, this.handleCachedAttributes);
    //face.detect(urls.slice(0,30), this.handleCachedAttributes, { attributes: 'glasses,mood,face,smiling' });
  };

  this.cacheAttributes = function(data) {
    if (data.attrs) {
      redis.mset(data.attrs);
    }
    else {
      console.log('error in faces_module.cacheAttributes');
    }
  };

  (function() {
    face.setAPIKeys(key, secret);
  })();
};

module.exports = new FaceClient('41be1e8bc43f9b5d79b421cd8995ba5f', 'f39eda942819dc053b16d26b8d25f76d');
