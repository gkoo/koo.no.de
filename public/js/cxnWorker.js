// ================
// cxnWorker.js
// ================
// Takes care of the minimal processing required for the current user's profile.

var findRelevantCxns,

STRIP_PUNC = /[^\w\s]/gi,

convertDateToVal = function(date) {
  var yearVal;
  if (!date) {
    return 0;
  }
  yearVal = (date.year - 1900)*12;
  return date.month ? yearVal + date.month : yearVal + 1;
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

anyDatesOverlap = function(startVal, endVal, myDates) {
  var i, length, dates;
  if (!myDates) { return 0; }

  length = myDates.length;
  for (i=0; i<length; ++i) {
    dates = myDates[i].split(':');
    if (datesOverlap(startVal, endVal, parseInt(dates[0], 10), parseInt(dates[1], 10))) {
      return true;
    }
  }
  // made it through without any dates overlapping.
  return false;
},

findRelevantCxns = function(myProfileId, employDates, connections, callback) {
  var i, j, cxn, positions, company, cmpKey, startVal, endVal, dates,
      cxnLength = connections && connections.values ? connections.values.length : 0,
      coworkers = {}; // hash where key is companyId/companyName and value is array of cxnId's

  for (cmpKey in employDates) {
    if (!coworkers[cmpKey]) {
      coworkers[cmpKey] = {};
    }
    coworkers[cmpKey][myProfileId] = employDates[cmpKey];
  }

  for (i=0; i<cxnLength; ++i) {
    // loop through connections
    cxn = connections.values[i];
    if (cxn.positions && cxn.positions.values && cxn.positions.values.length && cxn.pictureUrl) { // don't care about cxn if no picture
      positions = cxn.positions.values;
      for (j=0; j<cxn.positions.values.length; ++j) {
        // for each of the connection's positions...
        company = positions[j].company;
        if (company.name) {
          // use company name, since company id's aren't ubiquitous in all profiles
          cmpKey = company.name.toLowerCase().replace(STRIP_PUNC, '');

          // TODO: check for name as well, (handling non-standardized comp name)
          startVal = convertDateToVal(positions[j].startDate);
          endVal = convertDateToVal(positions[j].endDate);

          dates = coworkers[cmpKey];
          if (dates && anyDatesOverlap(startVal, endVal, dates[myProfileId])) {
            // common company AND dates overlap
            if (dates[cxn.id]) {
              dates[cxn.id].push(startVal + ':' + endVal);
            }
            else {
              dates[cxn.id] = [startVal + ':' + endVal];
            }
          }
        }
      }
    }
  }

  if (typeof callback !== 'undefined') {
    callback(null, coworkers);
  }
};

if (typeof self !== 'undefined') {
  // For Web Workers
  self.addEventListener('message', function(evt) {
    var i,
        data            = evt.data,
        profiles        = data ? data.profiles : null,
        employmentDates = data ? data.employmentDates : null;

    if (data.type === 'filterConnections') {
      if (profiles && employmentDates) {
        findRelevantCxns(data.myProfileId, employmentDates, profiles, function(err, coworkers) {
          if (err) {
            // handle error
          }
          else {
            self.postMessage({
              type: 'filterConnectionsResult',
              coworkers: coworkers
            });
          }
        });
      }
      else {
        // handle error
      }
    }
  }, false);
}

if (typeof exports !== 'undefined') {
  // For NodeJS module
  exports.findRelevantCxns = findRelevantCxns;
}
