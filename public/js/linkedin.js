// TODO: If a company doesn't have any dates, create a generic time window for it.
// TODO: handle no connections

$(function() {
  var ownProfile, myCareerStart, myCareerLength, socket,
      today         = new Date(),
      picElems      = $('.pics'),
      debugElem     = $('#debug'),
      introElem     = $('#intro'),
      overlayElem   = $('#overlay'),
      loadingElem   = $('#loading'),
      timelineElem  = $('#timeline'),
      thisMonth     = today.getMonth()+1,
      thisYear      = today.getFullYear(),
      currTime      = 0,
      currCompanies = [], // what company(ies) we're at in the timeline
      myProfileId   = -1,
      myCompanies   = [],
      PIC_SIZE      = 80,
      BORDER_SIZE   = 5,
      FRAME_WIDTH   = 1000,
      FRAME_HEIGHT  = 800,
      TIMELINE_HT   = 10,
      HALF_HEIGHT   = (FRAME_HEIGHT - TIMELINE_HT)/2,
      RIGHT_BOUND   = FRAME_WIDTH - PIC_SIZE - BORDER_SIZE*2,
      MONTHS        = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  convertDateFromVal = function(val) {
    return { month: Math.floor(val%12) || 12, year: Math.floor(1900+val/12) };
  },

  convertDateToVal = function(date) {
    return (date.year - 1900)*12 + date.month;
  },

  myCareerNow = convertDateToVal({ month: thisMonth, year: thisYear }),

  // set "career start" to a month before actual career start, so you have something to which you can drag.
  createMonthBuffer = function(positions) {
    var startDate, endDate, i;
    for (i=positions.length-1; i>=0; --i) {
      startDate = positions[i].startDate;
      if (startDate) {
        newPos    = new Position({
          startDate : { month: startDate.month - 1 || 12,
                        year:  startDate.year },
          endDate   : positions[i].startDate
        });
        ownProfile.positions.push(newPos);
        myCareerStart = newPos.startDate;
        myCareerLength = myCareerNow.val - myCareerStart.val;
        return;
      }
    }
    console.log('no start dates!! uh oh...');
    // TODO: HANDLE THIS CASE.
  },

  // Functions: getCurrentConnections
  // ================================
  // Get company connections for a given position on the timeline.
  getCurrentConnections = function(company, timelinePos) {
    var i, connection;
    if (!company) { console.log('no company; something is wrong!'); return; }
    if (company.connections) {
      for (i=0; i<company.connections.length; ++i) {
        connection = company.connections[i];
        if (connection.startDate
            && connection.startDate.val < timelinePos
            && (!connection.endDate || connection.endDate > timelinePos)) {
          // display connection's picture.
          debugElem.text(debugElem.text() + connection.firstName + ' ' + connection.lastName + ' ');
        }
      }
    }
  },

  isSameCompanies = function(companiesOld, companiesNew) {
    // given two arrays of companies, do they contain the same companies?
    // probably going to be a very small number of companies, okay to do brute force here
    var i, j, found;
    if (companiesOld.length !== companiesNew.length) { return false; }

    for (i=0; i<companiesOld.length; ++i) {
      found = false;
      for (j=0; j<companiesNew.length; ++j) {
        if (companiesOld[i].name === companiesNew[j].name) {
          found = true;
          break;
        }
        if (!found) { return false; }
      }
    }
    return true;
  },

  hidePic = function(pic) {
    pic.removeClass('picShowing')
       .removeClass('picToShow')
       .removeClass('picToHide');
    if (pic.hasClass('upper')) {
      pic.animate({ top: HALF_HEIGHT+PIC_SIZE + 'px' });
    }
    else {
      pic.animate({ top: PIC_SIZE*(-1.5) + 'px' });
    }
  },

  hidePics = function() {
    picElems.children('.picShowing').each(function() {
      var _this = $(this);
      if (!_this.hasClass('picToShow')) {
        hidePic(_this);
      }
    });
  },

  hideMarkedPics = function() {
    picElems.children('.picToHide').each(function() {
      hidePic($(this));
    });
  },

  showPics = function() {
    picElems.children('.picToShow').each(function() {
      var _this = $(this);
      _this.removeClass('picToShow');
      if (!_this.hasClass('picShowing')) {
        _this.addClass('picShowing')
             .animate({ top: _this.attr('li-top')+'px' });
      }
    });
  },

  // Functions: isConcurrentEmployee
  // ===============================
  // Given the current position on the timeline, is the connection
  // at the same company as the user?
  isConcurrentEmployee = function (profile) {
    var i, start, end, companyName,
        myCurrTime = Math.floor(currTime);

    if (!profile || !profile.employmentDates) { return false; }

    for (i=0; i<currCompanies.length; ++i) {
      companyName = currCompanies[i].name.toLowerCase();
      start = Math.floor(profile.employmentDates[companyName + ':startdate']);
      end   = Math.floor(profile.employmentDates[companyName + ':enddate']);

      // start is before currTime and (endtime is after currTime OR endtime is null)
      if ((start && (start < myCurrTime || start == myCurrTime))
            && (!end || (end > myCurrTime || end == myCurrTime))) {
        return true; // currently working at!
      }
    }
    return false; // not currently working at.
  },

  showExistingPictures = function (profiles) {
    var i, j, pic, isConcurrent;
    for (i=0; i<profiles.length; ++i) {
      pic = $('#' + profiles[i].id);
      if (pic) {
        isConcurrent = isConcurrentEmployee(profiles[i]);
        if (pic && isConcurrent) {
          pic.addClass('picToShow');
        }
        else if (pic && pic.hasClass('picShowing') && !isConcurrent) {
          pic.addClass('picToHide');
        }
      }
    }
  },

  updateCurrCompanies = function () {
    var tmpCurrCompanies = [];
    for (i=0; i<currCompanies.length; ++i) {
      if (currCompanies[i].employees) {
        showExistingPictures(currCompanies[i].employees);
      }
      else {
        tmpCurrCompanies.push(currCompanies[i]);
      }
    }
    hidePics();
    if (tmpCurrCompanies.length) {
      // the callback for this will call showPics()
      socket.send({
        type: 'getConnectionsByCompany',
        companies: tmpCurrCompanies
      });
    }
    else {
      showPics();
    }

    companyNames = [];
    for (i=0; i<currCompanies.length; ++i) {
      companyNames.push(currCompanies[i].name);
    }
    $('#companytitle').text(companyNames.join(', '));
  },

  updateDateLabel = function(timelinePos) {
    var timelineDate;
    if (!timelinePos || Math.floor(currTime) == Math.floor(timelinePos)) { return; }
    currTime = timelinePos;
    timelineDate = convertDateFromVal(timelinePos);
    $('#dateLabel').text([MONTHS[timelineDate.month-1], timelineDate.year].join(' '));
  }

  doDrag = function(evt, ui) {
    var positionRatio, timelinePos, i, j, company, startVal, endVal, companyNames, oldCurrCompanies, currPos;

    if (introElem.css('opacity')) { introElem.fadeTo('slow', 0); }

    // calculate how far along myPic is on the timeline.
    currPos = ui.position.left;
    positionRatio = currPos/RIGHT_BOUND;

    // calculate this position relative to our career timeline.
    timelinePos = (myCareerLength * positionRatio) + myCareerStart;
    updateDateLabel(timelinePos);
    oldCurrCompanies = currCompanies;
    currCompanies = [];

    for (i=0; i<myCompanies.length; ++i) {
      company  = myCompanies[i];
      startVal = convertDateToVal(company.startDate);
      endVal   = convertDateToVal(company.endDate);

      // check if we fall within the timeframe of this position
      if (startVal
          && startVal < timelinePos
          && (!endVal || endVal > timelinePos)) {
        // we have a match! this is the company on this stretch of the timeline.
        if (company.name) {
          $('#companytitle').text(company.name);
          currCompanies.push(company);
        }
      }
      // we're past our timeline position, so the remaining positions are irrelevant
      if (endVal && endVal < timelinePos) { break; }
    }

    if (currCompanies && currCompanies.length && !isSameCompanies(oldCurrCompanies, currCompanies)) {
      updateCurrCompanies();
    }
    else if (currCompanies.length) {
      // same companies, but let's still check for updated concurrent coworkers
      for (i=0; i<currCompanies.length; ++i) {
        if (currCompanies[i].employees) {
          showExistingPictures(currCompanies[i].employees);
        }
      }
      showPics();
      hideMarkedPics();
    }

    if (!currCompanies.length) {
      $('#companytitle').empty();
      hidePics();
      debugElem.empty();
    }
  },

  handleConnections = function(profiles) {
    var i, profile, position, company;
    if (!profiles.values) {
      debugElem.text('Sorry, you have no connections to display.');
      console.log('no profiles!!!');
      return;
    }
    socket.send({
      type: 'storeConnections',
      profiles: profiles
    });
  },

  convertDateToVal = function(date) {
    return date ? (date.year - 1900)*12 + date.month : 0;
  };

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

  handleOwnPositions = function (positions) {
    var i, company, startVal, endVal, width, left, newSection, timelineElem = $('#timeline');
    myCareerStart = convertDateToVal(positions[positions.length-1].startDate);
    myCareerLength = myCareerNow - myCareerStart;

    timelineElem.hide()
    for (i=0; i<positions.length; ++i) {
      company = positions[i].company;
      if (company && company.name) {
        myCompanies.push({
          name: company.name,
          startDate: positions[i].startDate,
          endDate: positions[i].endDate
        });

        //create a little sectionbar on the timeline for this company.
        /*
        startVal = convertDateToVal(positions[i].startDate);
        endVal = positions[i].endDate ? convertDateToVal(positions[i].endDate) : myCareerNow;
        width = (endVal-startVal)/myCareerLength*100 + '%';
        left = (startVal-myCareerStart)/myCareerLength*100 + '%';
        newSection = $('<div/>').css('height', '100%')
                                .css('width', width)
                                .css('left', left)
                                .css('position', 'absolute')
                                .css('background-color', '#f00')
                                .css('border', '1px solid #0c77af');
        timelineElem.append(newSection);
        */
      }
    }
    timelineElem.show();
    socket.send({
      type: 'myCompanies',
      companies: myCompanies
    });
  },

  handleOwnProfile = function (profile) {
    var pic;
    //ownProfile = new Profile(profile);
    if (!profile) {
      console.log('No own profile! Something is wrong!');
    }
    socket.send({
      type: 'storeOwnProfile',
      profile: profile
    });
    myProfileId = profile.id;
    //createMonthBuffer(ownProfile.positions);

    // Pull in connection data
    IN.API.Raw("/people/~/connections:(id,first-name,last-name,positions,picture-url,public-profile-url)").result(handleConnections);

    if (!profile.pictureUrl) {
      profile.pictureUrl = '/img/icon_no_photo_80x80.png';
    }

    pic = $('#mypic').attr('src', profile.pictureUrl)
                     .fadeTo('fast', 1);
    timelineElem.fadeTo('fast', 1);
    icon = $('#myicon').css('top', (FRAME_HEIGHT - 90)/2);
    icon.draggable({
      axis : 'x',
      drag: doDrag,
      containment: 'parent'
    });

    if (profile.positions && profile.positions.values) {
      // TODO: check if only one position
      handleOwnPositions(profile.positions.values);
    }
    else {
      debugElem.text('Sorry, you don\'t seem to have any positions. Why don\'t you update your profile?');
    }
  },

  storeEmployee = function (connection) {
    var i, cmpName, startKey, endKey, startDate, endDate;
    for (i=0; i<currCompanies.length; ++i) {
      cmpName = currCompanies[i].name.toLowerCase();
      startKey = [cmpName, 'startdate'].join(':');
      endKey = [cmpName, 'enddate'].join(':');
      startDate = connection.employmentDates[startKey];
      endDate = connection.employmentDates[endKey];
      // make sure the two worked there at the same time.
      if (startDate && datesOverlap(startDate,
                                    endDate,
                                    convertDateToVal(currCompanies[i].startDate),
                                    convertDateToVal(currCompanies[i].endDate))) {
        if (!currCompanies[i].employees) {
          currCompanies[i].employees = [connection];
        } else {
          currCompanies[i].employees.push(connection);
        }
      }
    }
  },

  handleCompanyConnections = function (connections) {
    var i, cxn, currPic, currLink, randLeft, randTop, randRotate,
        addToUpper = true;
    if (!connections) {
      console.log('no connections found');
      return;
    }
    hidePics();
    for (i=0; i<connections.length; ++i) {
      cxn = connections[i];
      if (cxn.pictureUrl) {
        // only store connection if they have a picture.
        storeEmployee(cxn);
        if (cxn.id !== myProfileId && cxn.pictureUrl) {
          currLink= $('#' + cxn.id);
          if (currLink.length && isConcurrentEmployee(cxn)) {
            // pic already exists, let's just prep it
            currLink.addClass('picToShow');
          }
          else {
            // pic doesn't exist; let's create it
            randLeft = Math.floor(Math.random()*RIGHT_BOUND);
            randTop = Math.floor(Math.random()*(HALF_HEIGHT-PIC_SIZE*2));
            randRotate = Math.floor(Math.random()*20)-10;

            if (!cxn.publicProfileUrl) {
              cxn.publicProfileUrl = '#';
            }
            currLink = $('<a/>').attr('href', cxn.publicProfileUrl)
                                .attr('title', cxn.fullName)
                                .attr('id', cxn.id)
                                .attr('target', '_new')
                                .css('-moz-transform', ['rotate(', randRotate, 'deg)'].join(''))
                                .css('-webkit-transform', ['rotate(', randRotate, 'deg)'].join(''))
                                .css('transform', ['rotate(', randRotate, 'deg)'].join(''))
                                .css('left', randLeft)
                                .css('position', 'absolute')
                                .css('background-image', 'url('+cxn.pictureUrl+')')
                                .addClass('cxnPic');
            if (isConcurrentEmployee(cxn)) {
              currLink.addClass('picToShow');
            }
            currLink.hover(function() {
              $(this).css('z-index', 1000);
            }, function() {
              $(this).css('z-index', '');
            });
            if (addToUpper) {
              currLink.addClass('upper')
                      .css('top', HALF_HEIGHT+PIC_SIZE)
                      .attr('li-top', randTop);
              $('#upper .pics').append(currLink);
            }
            else { //add to lower
              randTop += PIC_SIZE;
              currLink.addClass('lower')
                      .css('top', PIC_SIZE*(-1.5))
                      .attr('li-top', randTop);
              $('#lower .pics').append(currLink.addClass('lower'));
            }
            addToUpper = !addToUpper; // alternate adding pics top and bottom
          }
        }
      }
    }
    showPics();
  },

  onLinkedInAuth = function() {
    // get own profile
    overlayElem.show();
    overlayElem.css('z-index', 10);
    overlayElem.fadeTo('fast', 0.5);
    loadingElem.show();
    loadingElem.css('z-index', 11);
    loadingElem.fadeTo('fast', 1);
    IN.API.Raw("/people/~:(id,first-name,last-name,positions,picture-url)").result(handleOwnProfile);
  },

  onLinkedInLoad = function () {
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };

  socket = new io.Socket(null, {port: 80, rememberTransport: false});
  socket.connect();

  socket.on('message', function(message) {
    if (message.type !== 'undefined') {
      if (message.type === 'connectionsStored') {
        overlayElem.fadeTo('fast', 0);
        overlayElem.css('z-index', -999);
        loadingElem.fadeTo('fast', 0);
        loadingElem.css('z-index', -999);
        introElem.fadeTo('slow', 1);
        //debugElem.text('Connections stored!');
      }
      else if (message.type === 'connectionsByCompanyResult') {
        if (isSameCompanies(currCompanies, message.companies)) {
          handleCompanyConnections(message.connections);
        }
      }
    }
  });

  $('#printCompBtn').click(function() {
    console.log(myCompanies);
  });

});
