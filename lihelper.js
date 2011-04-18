var redis = require('redis').createClient(),

stripPunc = /[^\w\s]/gi,

storePosition, storeProfile, getConnectionsByCompany,

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

// loops through myDates and sees if any are overlapping.
convertDateToVal = function(date) {
  var yearVal;
  if (!date) {
    return 0;
  }
  yearVal = (date.year - 1900)*12;
  return date.month ? yearVal + date.month : yearVal + 1;
},

anyDatesOverlap = function(startVal, endVal, myDates) {
  var i, length, dates;
  if (!myDates) { return 0; }

  length = myDates.length;
  for (i=0; i<length; ++i) {
    dates = myDates[i].split(':');
    if (datesOverlap(startVal, endVal, parseInt(dates[0]), parseInt(dates[1]))) {
      return true;
    }
  }
  // made it through without any dates overlapping.
  return false;
},

findRelevantCxns = function(myProfileId, employDates, connections, cmpKeys, callback) {
  var i, j, cxn, positions, company, cmpKey, startVal, endVal, dates,
      cxnLength = connections.values.length,
      coworkers = {}; // hash where key is companyId/companyName and value is array of cxnId's

  for (cmpKey in employDates) {
    if (!coworkers[cmpKey]) {
      coworkers[cmpKey] = {};
    }
    coworkers[cmpKey][myProfileId] = employDates[cmpKey];
  }

  for (i=0; i<cxnLength; ++i) {
  //for (i=0; i<10; ++i) {
    // loop through connections
    cxn = connections.values[i];
    if (cxn.positions && cxn.positions._total && cxn.pictureUrl) { // don't care about cxn if no picture
      positions = cxn.positions.values;
      for (j=0; j<cxn.positions._total; ++j) {
        company = positions[j].company;
        if (company.name) {
          // use company name, since company id's aren't ubiquitous in all profiles
          cmpKey = company.name.toLowerCase().replace(stripPunc, '');

          // TODO: check for name as well, (handling non-standardized comp name)
          startVal = convertDateToVal(positions[j].startDate);
          endVal = convertDateToVal(positions[j].endDate);

          dates = coworkers[cmpKey];
          if (dates && anyDatesOverlap(startVal, endVal, dates[myProfileId])) {
            // common company AND dates overlap
            if (dates[cxn.id]) {
              dates[cxn.id].push([startVal, endVal].join(':'));
            }
            else {
              dates[cxn.id] = [[startVal, endVal].join(':')];
            }
          }
        }
      }
    }
  }
  callback(null, coworkers);
};

redis.on("error", function (err) {
  console.log("Redis error " + err);
});

exports.storePosition = storePosition = function(profileId, position, myProfileId) {
  var company = position.company,
      cmpKey, i, start, end;

  if (company && company.name) {
    company.name = company.name.toLowerCase().replace(stripPunc, '');
    //if (isRelevantCompany(company.name)) {
      // this is a connection
      //redis.sadd(['coworkers', myProfileId, company.name].join(':'), profileId);
    if (position.startDate) { // educations have no start date
      start = convertDateToVal(position.startDate);
      end = position.endDate ? convertDateToVal(position.endDate) : 0;
      dates = [start, end].join(':');
      cmpKey = company.name.toLowerCase().replace(stripPunc, '');
      redis.sadd(['employmentDates', profileId, cmpKey].join(':'), dates);
    }
    //}
  }
};

exports.storeProfile = storeProfile = function(profile, sessionId, callback) {
  var keyPrefix = ['profiles', profile.id].join(':'),
      fullName  = [profile.firstName, profile.lastName].join(' '),
      keyValuePairs = [keyPrefix],
      i, company;

  if (sessionId) {
    redis.set(['id', sessionId].join(':'), profile.id); // for future lookups
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

  if (profile.positions && profile.positions._total) {
    for (i = 0; i<profile.positions._total; ++i) {
      storePosition(profile.id, profile.positions.values[i]);
    }
  }

  if (callback) {
    // send signal that own profile has been stored,
    // so we don't load connections before we're ready.
    callback();
  }
  redis.incr(['views', profile.id].join(':'));
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
      var i, companyName, employmentDates = {}, cmpKeys = [], count = 0;
      for (i=0; i<dateKeys.length; ++i) {
        // for each dateKey (usually there's only one), add dates to profile
        redis.smembers(dateKeys[i], function(err, dates) {
          // dates for "companyName"
          var cmpKey;
          if (err) { console.log(err); return; }

          cmpKey = dateKeys[count].split(':')[2]; // counting on redis to return responses in order.
          cmpKeys.push(cmpKey);
          if (!employmentDates) { employmentDates = {}; }

          // associate these dates with the company
          employmentDates[cmpKey] = dates;
          if (count === dateKeys.length-1) {
            findRelevantCxns(myProfileId, employmentDates, profiles, cmpKeys, callback);
          } else {
            ++count;
          }
        });
      }
    });
    /*
    if (!profiles || !profiles.values) { return; }
    for (i=0; i<profiles.values.length; ++i) {
      storeProfile(profiles.values[i], { myProfileId: myProfileId });
    }
    callback();
    */
  });
};
