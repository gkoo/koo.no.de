var redis = require('redis').createClient(),

connections = [],

myCompanies = [],

stripPunc = /[^\w\s]/gi,

convertDateToVal, storePosition, storeProfile, getConnectionsByCompany,

// Function: getConnectionProfile
// ==============================
// Get info for one connection, push to connections array for passing back to client
getConnectionProfile = function (connectionId, isLast, callback) {
  redis.hgetall(['profiles', connectionId].join(':'), function(err, profile) {
    // get all profile fields and combine them into one profile object
    if (err) { console.log(err); return; }
    redis.keys(['employmentDates', profile.id, '*'].join(':'), function(err, dateKeys) {
      // find all employmentDates for connection
      var i, companyName, employmentDates, count = 0;
      for (i=0; i<dateKeys.length; ++i) {
        // for each dateKey (usually there's only one), add dates to profile
        companyName = dateKeys[i].split(':')[2];
        redis.smembers(dateKeys[i], function(err, dates) {
          var companyName = dateKeys[count].split(':')[2]; // counting on redis to return responses in order.
          if (err) { console.log(err); return; }
          if (!profile.employmentDates) { profile.employmentDates = {}; }
          // associate these dates with the company
          profile.employmentDates[companyName] = dates;
          connections.push(profile);
          if (isLast && count === dateKeys.length-1) {
            callback(null, connections);
          } else {
            ++count;
          }
        });
      }
    });
  });
},

datesOverlap = function(startVal1, endVal1, startVal2, endVal2) {
  if (!startVal1 || !startVal2) { return false; } // require both startVals

  if (endVal1 && endVal2) {
    // all dates exist
    // NO  1 1 2 2
    // NO  2 2 1 1
    // YES everything else
    return (endVal1 > startVal2 && startVal1 < endVal2);
  }

  if (!endVal1 && !endVal2) { return true; } // both dates ongoing

  if (!endVal1) { // all exist except endVal1
    return startVal1 < endVal2;
  }

  return startVal2 < endVal1; // endVal1 && !endVal2
},

// Function: isRelevantCompany
// ===========================
// Is one of current user's companies
isRelevantCompany = function(companyName) {
  var i;
  for (i=0; i<myCompanies.length; ++i) {
    if (myCompanies[i].name === companyName) {
      return true;
    }
  }
  return false;
};

redis.on("error", function (err) {
  console.log("Redis error " + err);
});

exports.convertDateToVal = convertDateToVal = function(date) {
  var yearVal;
  if (!date) {
    console.log('no date. something is wrong.');
    return null;
  }
  yearVal = (date.year - 1900)*12;
  return date.month ? yearVal + date.month : yearVal;
};

exports.storePosition = storePosition = function(profileId, position, myProfileId) {
  var company = position.company,
      i, start, end;

  if (company && company.name) {
    company.name = company.name.toLowerCase().replace(stripPunc, '');
    if (isRelevantCompany(company.name)) {
      // this is a connection
      redis.sadd(['coworkers', myProfileId, company.name].join(':'), profileId);
      if (position.startDate) { // educations have no start date
        start = convertDateToVal(position.startDate);
        end = position.endDate ? convertDateToVal(position.endDate) : 0;
        dates = [start, end].join(':');
        redis.sadd(['employmentDates', profileId, company.name].join(':'), dates);
      }
    }
  }
};

exports.storeProfile = storeProfile = function(profile, options) {
  var keyPrefix = ['profiles', profile.id].join(':'),
      fullName  = [profile.firstName, profile.lastName].join(' '),
      keyValuePairs = [keyPrefix],
      i, company;

  if (options.mySessionId) {
    redis.set(['id', options.mySessionId].join(':'), profile.id); // for future lookups
  }

  keyValuePairs.push('id', profile.id);
  if (profile.firstName || profile.lastName) {
    keyValuePairs.push('fullName', fullName);
  }
  if (profile.pictureUrl) {
    keyValuePairs.push('pictureUrl', profile.pictureUrl);
  }
  if (profile.publicProfileUrl) {
    keyValuePairs.push('publicProfileUrl', profile.publicProfileUrl);
  }
  redis.hmset(keyValuePairs);

  if (!options.mySessionId && profile.positions && profile.positions.values && profile.positions.values.length) {
    for (i = 0; i<profile.positions.values.length; ++i) {
      storePosition(profile.id, profile.positions.values[i], options.myProfileId);
    }
  }
  else if (profile.positions && profile.positions.values && profile.positions.values.length) {
    // isSelf
    for (i = 0; i<profile.positions.values.length; ++i) {
      company = profile.positions.values[i].company;
      if (company.name) {
        company.name = company.name.toLowerCase().replace(stripPunc, '');
        myCompanies.push(company);
      }
    }

    if (options.callback) {
      // send signal that own profile has been stored,
      // so we don't load connections before we're ready.
      options.callback();
    }

    redis.incr(['views', profile.id].join(':'));
  }
};

exports.getConnectionsByCompany = getConnectionsByCompany = function(sessionId, companies, callback) {
  redis.get(['id', sessionId].join(':'), function(err, profileId) {
    var i, keys = [];

    if (!companies) { return; }

    for (i=0; i<companies.length; ++i) {
      keys.push(['coworkers', profileId, companies[i].name].join(':'));
    }

    if (keys && keys.length) {
      redis.sunion(keys, function(err, cxnIds) {
        var isLast;
        if (err) {
          console.log('Something went wrong with the union of companies!');
          console.log(err);
          callback(err);
        }
        else {
          connections = [];
          for (i=0; i<cxnIds.length; ++i) {
            isLast = (i === cxnIds.length-1);
            getConnectionProfile(cxnIds[i], isLast, isLast ? callback : null);
          }
        }
      });
    }
    else {
      console.log('No keys! Can\'t get connections');
    }
  });
};

exports.storeConnections = function(sessionId, profiles, callback) {
  redis.get(['id', sessionId].join(':'), function(err, myProfileId) {
    var i;
    if (err) {
      console.log(err);
      return;
    }
    if (!profiles || !profiles.values) { return; }
    for (i=0; i<profiles.values.length; ++i) {
      storeProfile(profiles.values[i], { myProfileId: myProfileId });
    }
    callback();
  });
};

exports.getAllConnections = function(sessionId, callback) {
  if (myCompanies && myCompanies.length) {
    getConnectionsByCompany(sessionId, myCompanies, callback);
  }
  else {
    console.log('no myCompanies');
  }
};
