var redis         = require('redis').createClient(),
    profileWorker = require('./public/js/profileWorker.js'),
    cxnWorker     = require('./public/js/cxnWorker.js'),

STRIP_PUNC = /[^\w\s]/gi,

storePosition, storeOwnProfile, getConnectionsByCompany,

convertDateToVal = function(date) {
  var yearVal;
  if (!date) {
    return 0;
  }
  yearVal = (date.year - 1900)*12;
  return date.month ? yearVal + date.month : yearVal + 1;
};

redis.on("error", function (err) {
  console.log("Redis error " + err);
});

// only called for user
exports.storePosition = storePosition = function(profileId, position) {
  var formattedDates = profileWorker.formatPositionDates(position);

  if (typeof formattedDates !== 'undefined') {
    datesKey = ['employmentDates', profileId, formattedDates.cmpName].join(':');
    redis.sadd(datesKey, formattedDates.dates);
    redis.expire(datesKey, 1800);
  }
};

exports.filterConnections = function(sessionId, profiles, callback) {
  redis.get(['id', sessionId].join(':'), function(err, myProfileId) {
    var i;
    if (err) {
      console.log(err);
      return;
    }
    redis.keys(['employmentDates', myProfileId, '*'].join(':'), function(err, dateKeys) {
      // find all employmentDates for user and populate employmentDates object
      var i, companyName, employmentDates = {}, count = 0;
      if (err) {
        console.log(err);
        return;
      }
      for (i=0; i<dateKeys.length; ++i) {
        // for each dateKey (usually there's only one), add dates to profile
        redis.smembers(dateKeys[i], function(err, dates) {
          // dates for "companyName"
          if (err) { console.log(err); return; }

          var cmpKey = dateKeys[count].split(':')[2]; // counting on redis to return responses in order.
          if (!employmentDates) { employmentDates = {}; }

          // associate these dates with the company
          employmentDates[cmpKey] = dates;
          if (count === dateKeys.length-1) {
            cxnWorker.findRelevantCxns(myProfileId, employmentDates, profiles, callback);
          } else {
            ++count;
          }
        });
      }
    });
  });
  console.log('done with filterConnections');
};

// only called for user
exports.storeOwnProfile = storeOwnProfile = function(profile, sessionId, callback) {
  var idKey = ['id', sessionId].join(':'),
      fullName  = [profile.firstName, profile.lastName].join(' '),
      lastViewed = (new Date()).toUTCString(),
      position, datesKey;

  if (sessionId) {
    redis.set(idKey, profile.id); // for future lookups
    redis.expire(idKey, 900);
  }

  profileWorker.storeFormattedPositionDates(profile, function(cmpEmployDates) {
    if (typeof cmpEmployDates !== 'undefined') {
      datesKey = ['employmentDates', profile.id, cmpEmployDates.cmpName].join(':');
      redis.sadd(datesKey, cmpEmployDates.dates);
      redis.expire(datesKey, 1800);
    }
  });

  if (callback) {
    // send signal that own profile has been stored,
    // so we don't load connections before we're ready.
    callback(sessionId);
  }

  // do some logging
  redis.hincrby(['profiles', profile.id].join(':'), 'count', 1);
  redis.hset(['profiles', profile.id].join(':'), 'lastViewed', lastViewed);
  redis.hset('viewlog', [fullName, profile.id].join(':'), lastViewed);
  console.log('done with storeOwnProfile');
};
