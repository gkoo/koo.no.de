// TODO: 
var redis = require('redis').createClient(),

connections = [],

myCompanies = [],

myProfileId = 0,

// Function: getConnectionProfile
// ==============================
// Get info for one connection, push to connections array for passing back to client
getConnectionProfile = function (connectionId, isLast, callback) {
  redis.hgetall(['profiles', connectionId].join(':'), function(err, profile) {
    redis.hgetall(['employmentDates', connectionId].join(':'), function(err, dates) {
      profile.employmentDates = dates;
      connections.push(profile);
      if (isLast) {
        callback(null, connections);
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

exports.storePosition = storePosition = function(profileId, position) {
  var company = position.company,
      keyValuePairs = [],
      i, companyname;

  if (company && company.name && isRelevantCompany(company.name)) {
    // this is a connection
    companyname = company.name.toLowerCase();
    redis.sadd(['coworkers', myProfileId, companyname].join(':'), profileId);
    if (position.startDate) { // educations have no start date
      keyValuePairs.push(['employmentDates', profileId].join(':'), [companyname, 'startdate'].join(':'), convertDateToVal(position.startDate));
      if (position.endDate) {
        keyValuePairs.push([companyname, 'enddate'].join(':'), convertDateToVal(position.endDate));
      }
      redis.hmset(keyValuePairs);
    }
  }
};

exports.storeProfile = storeProfile = function(profile, isSelf/*optional*/, callback/*optional*/) {
  var keyPrefix = ['profiles', profile.id].join(':'),
      fullName  = [profile.firstName, profile.lastName].join(' '),
      keyValuePairs = [keyPrefix],
      i, company;

  if (typeof isSelf === 'undefined') { isSelf = false; }

  if (isSelf) { myProfileId = profile.id; }

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

  if (!isSelf && profile.positions && profile.positions.values) {
    for (i = 0; i<profile.positions.values.length; ++i) {
      storePosition(profile.id, profile.positions.values[i], true);
    }
  }
  else if (profile.positions && profile.positions.values && profile.positions.values._total) { // isSelf
    for (i = 0; i<profile.positions.values.length; ++i) {
      company = profile.positions.values[i].company;
      if (company.name) {
        myCompanies.push(company.name);
      }
    }
  }
};

exports.storeConnections = function(profiles, callback) {
  var i;
  if (!profiles || !profiles.values) { return; }
  for (i=0; i<profiles.values.length; ++i) {
  //for (i=0; i<10; ++i) {
    storeProfile(profiles.values[i]);
  }
  callback();
};

exports.getConnectionsByCompany = function(companies, callback) {
  var i, keys = [];

  if (!companies) { return; }

  for (i=0; i<companies.length; ++i) {
    keys.push(['coworkers', myProfileId, companies[i].name.toLowerCase()].join(':'));
  }

  redis.sunion(keys, function(err, replies) {
    var isLast;
    if (err) {
      console.log('Something went wrong with the union of companies!');
      callback(err);
    }
    else {
      connections = [];
      for (i=0; i<replies.length; ++i) {
        isLast = (i === replies.length-1);
        getConnectionProfile(replies[i], isLast, isLast ? callback : null);
      }
    }
  });
};

exports.storeMyCompanies = function(companies) {
  // TODO:  make sure this is a deep copy.
  myCompanies = companies;
};