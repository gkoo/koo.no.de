var redis   = require('redis').createClient(),
    results = {};

exports.retrieveCached = function(data, callback) {
  var urls = data.urls,
      i;
  redis.mget(urls, callback);
};

exports.cacheAttributes = function(data) {
  if (data.attrs) {
    redis.mset(data.attrs);
  }
  else {
    console.log('error in faces_module.cacheAttributes');
  }
};
