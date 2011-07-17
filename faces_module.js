var redis   = require('redis').createClient(),
    face    = require('./face_api_client.js'),

FaceClient = function(key, secret) {

  var _this = this;

  this.handleFaceResult = function(response) {
    // TODO: cache in redis.
    // TODO: send to browser
    var photoAttrsArr = [], // array of attributes to store in redis
        attrs;
    console.log(response.photos.length + ' num of photos');
    console.log(response.photos);
    for (i=0,photos=response.photos,len=photos.length; i<len; ++i) {
      photo = photos[i];
      if (!photo.tags || !photo.tags.length || !photo.tags[0].attributes || !photo.tags[0].attributes.glasses) {
        // no attributes
        attrs = { face: false,
                  url: photo.url ? photo.url : '' }
        _this.response.push(JSON.stringify(attrs));
      }
      else {
        // yes attributes
        attrs = photo.tags[0].attributes;
        attrs.url = photo.url;
        _this.response.push(JSON.stringify(attrs)); // add to response to send to browser
      }
      photoAttrsArr.push('photoattrs:' + photo.url);
      photoAttrsArr.push(JSON.stringify(attrs));
    }
    if (photoAttrsArr.length) {
      redis.mset(photoAttrsArr);
    }
    if (_this.response.length === _this.urls.length) {
      console.log('invoking callback');
      _this.retrieveCallback(_this.response);
    }
    // need to use socket.io
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

    _this.response = [];
    for (; i<len; ++i) {
      id = _this.profiles[i].id;
      attrs = response[i];
      result[id] = attrs;
      if (!attrs) {
        // if no cached result, add to array to request from face.com
        nullAttrUrls.push(_this.profiles[i].pictureUrl);
      }
      else {
        _this.response.push(attrs);
      }
    }
    len = nullAttrUrls.length;
    console.log(['LOG:', len, 'urls with no attributes'].join(' '));

    if (_this.response.length === _this.urls.length) {
      // all photo attributes were cached! just return the response.
      _this.retrieveCallback(_this.response);
    }

    // fetch non-cached picture attriubtes from face.com
    start = 0;
    while(start < len) {
      end = start + MAX_DETECT < len ? start+MAX_DETECT : len;
      console.log('start: ' + start + ' end: ' + end);
      face.detect(nullAttrUrls.slice(start, end), _this.handleFaceResult, { attributes: 'glasses,mood,smiling' });
      start = end;
    }
  };

  this.retrieveCached = function(data, callback) {
    var i = 0,
        len = data.profiles.length,
        profile,
        profilesArr = []; // array of profiles to store in redis

    this.urls = [];
    this.profiles = data.profiles;
    this.retrieveCallback = callback;

    for (i in this.profiles) {
      this.urls.push('photoattrs:' + this.profiles[i].pictureUrl);
      profilesArr.push('profile:' + this.profiles[i].pictureUrl);
      profilesArr.push(JSON.stringify(this.profiles[i]));
    }
    redis.mset(profilesArr);

    redis.mget(this.urls, this.handleCachedAttributes);
    //face.detect(urls.slice(0,30), this.handleCachedAttributes, { attributes: 'glasses,mood,face,smiling' });
  };

  (function() {
    face.setAPIKeys(key, secret);
  })();
};

module.exports = new FaceClient('41be1e8bc43f9b5d79b421cd8995ba5f', 'f39eda942819dc053b16d26b8d25f76d');
