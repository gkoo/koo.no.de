// TODO: make pics more likely to go on bottom
// TODO: test in IE (opacity/filter, etc)
// TODO: setTimeout showerror
// TODO: check to make sure a start/endDate without month shows correctly
//
// FUTURE ENHANCEMENTS?
// explain why a connection is absent (no picture)
// explain why a company is absent (no dates)

var onLinkedInLoad;

$(function() {
  var ownProfile, myCareerStart, myCareerLength, socket, myCoworkers,
      today           = new Date(),
      picElems        = $('.pics'),
      loadingElem     = $('#loading'),
      timelineElem    = $('#timeline'),
      myPicElem       = $('#mypic'),
      messageElem     = $('#message'),
      playBtn         = $('#playBtn'),
      speedElem       = $('#speed'),
      signinElem      = $('#signin'),
      logoElem        = $('#logo img'),
      tlStuffElem     = $('#timelineStuff'),
      headerElem      = $('#header'),
      topBlockElem    = timelineElem.children('.top.block'),
      bottomBlockElem = timelineElem.children('.bottom.block'),
      thisMonth       = today.getMonth()+1,
      thisYear        = today.getFullYear(),
      ioConnected     = 0,
      profileStored   = 0,
      cxnsLoaded      = 0, // boolean flag
      currTime        = 0,
      currCompanies   = [], // what company(ies) we're at in the timeline
      myProfileId     = -1,
      myConnections   = {},
      myCompanies     = [],
      mySessionId     = 0,
      //PORT            = 8080,
      PORT            = 80,
      PIC_SIZE        = 80,
      BORDER_SIZE     = 1,
      FRAME_WIDTH     = 1000,
      HEADER_WIDTH    = 290,
      HEADER_HEIGHT   = 126, // 76 + 50 padding
      TL_WIDTH        = 970,
      TL_HEIGHT       = 140,
      TL_BLOCK_HT     = 30,
      TL_HZ_PADDING   = 20,
      HALF_HEIGHT     = 315,
      LEFT_BOUND      = TL_HZ_PADDING,
      RIGHT_BOUND     = TL_HZ_PADDING + TL_WIDTH - PIC_SIZE - BORDER_SIZE*2,
      MONTHS          = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      MONTHS_ABBR     = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      COLORS          = ['orange', 'blue', 'green', 'purple', 'teal', 'red', 'yellow', 'magenta', 'grey'],
      STRIP_PUNC      = /[^\w\s]/gi;

  convertDateFromVal = function(val) {
    var month = Math.floor(val%12) || 12;
    return { month: month, year: Math.floor(1900+(val-month)/12) };
  },

  convertDateToVal = function(date) {
    if (!date) { return 0; }
    return (date.year - 1900)*12 + date.month;
  },

  myCareerNow = convertDateToVal({ month: thisMonth, year: thisYear }),

  // Function: showErrorMsg
  // ===============================
  // Shows an message to the user, usually in the event of an error.
  // If no arguments are given, a generic message is shown.
  showErrorMsg = function(topText, bottomText, linkText, linkUrl) {
    var link;

    tlStuffElem.fadeTo('slow', 0);
    tlStuffElem.hide();

    signinElem.fadeTo('slow', 0);
    signinElem.hide();

    loadingElem.fadeTo('slow', 0);
    loadingElem.hide();

    if (!topText) {
      // no arguments, do general error
      topText = 'Whoops... we broke something.';
      bottomText = 'In the mean time, ';
      linkText = 'check out LinkedIn Today!';
      linkUrl = 'http://www.linkedin.com/today/';
    }

    link = $('<a/>').attr('href', linkUrl)
                    .text(linkText);

    messageElem.append($('<p/>').text(topText))
               .append($('<p/>').text(bottomText)
                                .append(link));

    messageElem.show();
    messageElem.fadeTo('slow', 1, function() {
    });

  },

  isSameCompanies = function(companiesOld, companiesNew) {
    // given two arrays of companies, do they contain the same companies?
    // probably going to be a very small number of companies, okay to do brute force here
    var i, j, found, oldlength = companiesOld.length, newlength = companiesNew.length;
    if (oldlength !== newlength) { return false; }

    for (i=0; i<oldlength; ++i) {
      found = false;
      for (j=0; j<newlength; ++j) {
        if (companiesOld[i].name === companiesNew[j].name) {
          found = true;
          break;
        }
      }
      if (!found) { return false; }
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

  // Function: isConcurrentEmployee
  // ===============================
  // Given the current position on the timeline, is the connection
  // at the same company as the user?
  isConcurrentEmployee = function (cxnDates) {
    var i, theirDate, start, end,
        theirLength = cxnDates.length,
        myCurrTime = Math.floor(currTime);

    for (i=0; i<theirLength; ++i) {
      cxnDate = cxnDates[i].split(':');
      start   = parseInt(cxnDate[0]);
      end     = parseInt(cxnDate[1]);
      // start is before currTime and (endtime is after currTime OR endtime is null)
      if ((start && (start < myCurrTime || start == myCurrTime))
            && (!end || (end > myCurrTime || end == myCurrTime))) {
        return true; // currently working at!
      }
    }
    return false; // not currently working at.
  },

  showExistingPictures = function (coworkers, currTime) {
    var pic, isConcurrent, length, myDates;
    if (!coworkers) { return; }

    myDates = coworkers[myProfileId];
    for (id in coworkers) {
      if (id !== myProfileId) {
        pic = $('#' + id);
        if (pic) {
          isConcurrent = isConcurrentEmployee(coworkers[id]);
          if (pic && isConcurrent) {
            pic.addClass('picToShow');
            pic.removeClass('picToHide'); // in case coworker overlaps in two simultaneous companies
          }
          else if (pic && pic.hasClass('picShowing') && !isConcurrent && !pic.hasClass('picToShow')) {
            pic.addClass('picToHide');
          }
        }
      }
    }
  },

  updateCurrCompanies = function (currTime) {
    var name, cmpKey, cmp,
        length = currCompanies.length;
    for (i=0; i<length; ++i) {
      cmp = currCompanies[i];
      cmpKey = cmp.unformattedName;
      if (myCoworkers[cmpKey]) {
        showExistingPictures(myCoworkers[cmpKey], currTime);
      }
    }
    hidePics();
    showPics();

    companyNames = [];
    $('.infoBlock').css('opacity', 0);
    for (i=0; i<length; ++i) {
      name = currCompanies[i].name.toLowerCase()
                                  .replace(/\s/g, '')
                                  .replace(STRIP_PUNC, '');
      $('.' + name).css('opacity', 1); // this is an .infoBlock
    }
  },

  doDrag = function(left) {
    var positionRatio, timelinePos, i, company, startVal, endVal, oldCurrCompanies, myCompaniesLength, currCompaniesLength, coworkers;

    // calculate how far along myPic is on the timeline.
    positionRatio = (left - LEFT_BOUND)/(RIGHT_BOUND - LEFT_BOUND);

    // calculate this position relative to our career timeline.
    timelinePos = (myCareerLength * positionRatio) + myCareerStart;
    currTime = timelinePos;
    oldCurrCompanies = currCompanies;
    currCompanies = [];
    myCompaniesLength = myCompanies.length;

    // get new currCompanies
    for (i=0; i<myCompaniesLength; ++i) {
      company  = myCompanies[i];
      startVal = convertDateToVal(company.startDate);
      endVal   = convertDateToVal(company.endDate);

      // check if we fall within the timeframe of this position
      if (startVal
          && startVal < timelinePos
          && (!endVal || endVal > timelinePos)) {
        // we have a match! this is the company on this stretch of the timeline.
        if (company.name) {
          currCompanies.push(company);
        }
      }
      // we're past our timeline position, so the remaining positions are irrelevant
    }

    currCompaniesLength = currCompanies.length;
    if (currCompaniesLength && !isSameCompanies(oldCurrCompanies, currCompanies)) {
      updateCurrCompanies(currTime);
    }
    else if (currCompaniesLength) {
      // same companies, but let's still check for updated concurrent coworkers
      for (i=0; i<currCompaniesLength; ++i) {
        coworkers = myCoworkers[currCompanies[i].unformattedName];
        if (coworkers) {
          showExistingPictures(coworkers, currTime);
        }
      }
      showPics();
      hideMarkedPics();
    }

    if (!currCompaniesLength) {
      $('.infoBlock').css('opacity', 0);
      hidePics();
    }
  },

  doDragWrapper = function(evt, ui) {
    myPicElem.stop(true);
    playBtn.text('Play');
    doDrag(ui.position.left);
  },

  convertDateToVal = function(date) {
    if (!date) return 0;
    if (!date.month) { date.month = 1; } // default month to January
    return date ? (date.year - 1900)*12 + date.month : 0;
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

    if ((!endVal1 && !endVal2) || (endVal1 == 0 && endVal2 == 0)) { return true; } // both dates ongoing

    if (!endVal1) { // all exist except endVal1
      return startVal1 < endVal2;
    }

    return startVal2 < endVal1; // endVal1 && !endVal2
  },

  timelineHasRoom = function(compDates, startDate, endDate) {
    var compDate, i, length = compDates.length;
    if (compDates && !length) { return 1; }
    for (i=0; i<length; ++i) {
      compDate = compDates[i].split(':');
      if (datesOverlap(compDate[0], compDate[1], startDate, endDate)) {
        return false;
      }
    }
    // got through without any dates overlapping
    return true;
  },

  addBlockToTimeline = function(blockElem, dateElem, infoElem, timeline) {
    if (timeline === 'top') {
      topBlockElem.append(blockElem);
      timelineElem.children('.top.date').append(dateElem);
      timelineElem.children('.top.info').append(infoElem);
    }
    else {
      bottomBlockElem.append(blockElem);
      timelineElem.children('.bottom.date').append(dateElem);
      timelineElem.children('.bottom.info').append(infoElem);
    }
  },

  createTimelineBlock = function(position, count, topCompDates, bottomCompDates) {
    //create a little sectionbar on the timeline for this company.
    var startVal, endVal, newBlock, newDate, newInfo, tmpStart, color, zindex, compDate, topHasRoom, botHasRoom, left,
        compEndDate = '';
    startVal = convertDateToVal(position.startDate);
    endVal = position.endDate ? convertDateToVal(position.endDate) : myCareerNow;
    width = (endVal-startVal)/myCareerLength*100 + '%';
    zindex = Math.floor((startVal-myCareerStart)/myCareerLength*100); // (It's just the "left" css property; see next line.)
    left = Math.floor((startVal-myCareerStart))/myCareerLength*100 + '%';
    color = COLORS[count%COLORS.length];
    if (position.endDate) {
      compEndDate = ' - ' +
                     MONTHS_ABBR[position.endDate.month-1] +
                     ' ' +
                     position.endDate.year;
    }
    compDate = '(' +
               MONTHS_ABBR[position.startDate.month-1] +
               ' ' +
               position.startDate.year +
               compEndDate +
               ')';

    newBlock = $('<div/>').css('height', '100%')
                          .css('width', width)
                          .css('left', left)
                          .css('z-index', zindex) // ensure later blocks show over earlier blocks
                          .css('position', 'absolute')
                          .css('border-left', '1px solid #fff')
                          .addClass(color);

    newDate = $('<span/>').text(MONTHS_ABBR[position.startDate.month-1] +
                                 ' ' +
                                 position.startDate.year)
                          .css('position', 'absolute')
                          .css('z-index', zindex)
                          .css('left', left)
                          .attr('li-zindex', zindex);

    newInfo = $('<span/>').css('left', left)
                          .css('z-index', zindex)
                          .attr('li-zindex', zindex)
                          .addClass('infoBlock')
                          .addClass(position.company.name.toLowerCase()
                                            .replace(/\s/g,'')
                                            .replace(STRIP_PUNC, ''))
                          .append($('<span/>').addClass('compName')
                                              .text(position.company.name))
                          .append($('<span/>').addClass('compDate')
                                              .text(compDate));

    topHasRoom = timelineHasRoom(topCompDates, startVal, endVal);
    botHasRoom = timelineHasRoom(bottomCompDates, startVal, endVal);
    if ((topHasRoom && botHasRoom) || (!topHasRoom && !botHasRoom)) {
      if (count%2) {
        addBlockToTimeline(newBlock, newDate, newInfo, 'top');
        topCompDates.push(startVal + ':' + endVal);
      }
      else {
        addBlockToTimeline(newBlock, newDate, newInfo, 'bottom');
        bottomCompDates.push(startVal + ':' + endVal);
      }
    }
    else if (topHasRoom) {
      addBlockToTimeline(newBlock, newDate, newInfo, 'top');
      topCompDates.push(startVal + ':' + endVal);
    }
    else if (botHasRoom) {
      addBlockToTimeline(newBlock, newDate, newInfo, 'bottom');
      bottomCompDates.push(startVal + ':' + endVal);
    }
  },

  handleOwnPositions = function (positions) {
    var i, position, company, width, left, companyLength, positionsSorted,
        topCompDates = [],
        bottomCompDates = [],
        length = positions.length;

    timelineElem.hide()
    myCareerStart = convertDateToVal(positions[0].startDate);
    for (i=0; i<length; ++i) {
      position = positions[i];
      company = position.company;
      if (company && company.name) {
        myCompanies.push({
          id:               company.id,
          name:             company.name,
          unformattedName:  company.name.toLowerCase().replace(STRIP_PUNC, ''),
          startDate:        position.startDate,
          endDate:          position.endDate
        });
        tmpStart = convertDateToVal(position.startDate);
        if (tmpStart < myCareerStart) {
          myCareerStart = tmpStart;
        }
      }
    }
    myCareerLength = myCareerNow - myCareerStart;

    for (i=0; i<length; ++i) {
      createTimelineBlock(positions[i], i, topCompDates, bottomCompDates);
    }
    timelineElem.show();
  },

  // Function: addEducationToPositions
  // ---------------------------------
  // Treat educations like normal "companies" for the purposes of our timeline
  addEducationToPositions = function(profile) {
    var i, j, educations, edu, newEduObj, length, posLength;
    if (profile.educations && profile.educations.values) {
      educations = profile.educations.values;
      length = educations.length;
      for (i=0; i<length; ++i) {
        edu = educations[i];
        if (edu.startDate) {
          newEduObj = {
            company: { name: edu.schoolName },
            startDate: edu.startDate,
            endDate: edu.endDate
          };
          if (profile.positions && profile.positions.values) {
            // insert education in correct place for optimal timeline block placement
            posLength = profile.positions.values.length;
            for (j=posLength-1; j>=0; --j) {
              if (profile.positions.values[j].endDate &&
                  (convertDateToVal(profile.positions.values[j].endDate) > convertDateToVal(edu.endDate))) {

                profile.positions.values.splice(j+1, 0, newEduObj);
                break;

              }
              else if (j === 0) {
                // education is most recent block in timeline
                profile.positions.values.splice(0, 0, newEduObj);
              }
            }
            ++profile.positions._total;
          }
          else {
            // no positions, create new positions object.
            if (!profile.positions) {
              profile.positions = {};
            }
            profile.positions._total = 1;
            profile.positions.values = [newEduObj];
          }
        }
      }
    }
  }

  handleOwnProfile = function (profile) {
    var pic;
    if (!profile) {
      return showErrorMsg();
    }
    if (!ioConnected) {
      ownProfile = profile;
      return;
    }
    if (!profile.positions._total) {
      showErrorMsg('You don\'t have any companies listed.',
                   'Why not ',
                   'add some now?',
                   'http://www.linkedin.com/profile/edit?trk=li_timeline');
      return;
    }
    addEducationToPositions(profile);
    socket.send({
      type: 'storeOwnProfile',
      profile: profile
    });
    myProfileId = profile.id;


    if (!profile.pictureUrl) {
      profile.pictureUrl = '/img/icon_no_photo_80x80.png';
    }

    pic = $('#mypic').attr('src', profile.pictureUrl)
                     .fadeTo('fast', 1);
    timelineElem.fadeTo('fast', 1);
    myPicElem.css('top', (TL_HEIGHT - PIC_SIZE)/2-BORDER_SIZE);
    myPicElem.draggable({
      axis : 'x',
      drag: doDragWrapper,
      containment: 'parent'
    });

    if (profile.positions && profile.positions.values) {
      // TODO: check if only one position
      handleOwnPositions(profile.positions.values);
    }
  },

  createEmployDates = function(cxn) {
    var cmpName, cmpId, key, position, start, end, employDates = {};
    if (!cxn.positions) { return; }

    for (var i=0; i<cxn.positions._total; ++i) {
      position = cxn.positions.values[i];
      start = convertDateToVal(position.startDate);
      end = convertDateToVal(position.endDate);
      cmpName = position.company.name ? position.company.name.toLowerCase().replace(STRIP_PUNC, '') : '';
      if (cmpName) {
        if (employDates[cmpName]) {
          employDates[cmpName].push(start + ':' + end);
        }
        else if (cmpName) {
          employDates[cmpName] = [start + ':' + end];
        }
      }
    }
    return employDates;
  },

  storeConnection = function (connection) {
    var i, j, newCxn, cmpName, startDate, endDate, datesLength, length = myCompanies.length;
    newCxn = {};
    newCxn.id               = connection.id;
    newCxn.pictureUrl       = connection.pictureUrl;
    newCxn.publicProfileUrl = connection.publicProfileUrl;
    newCxn.fullName         = connection.firstName + ' ' + connection.lastName;
    newCxn.employmentDates  = createEmployDates(connection);
    myConnections[connection.id]  = newCxn;
  },

  createCxnPic = function(connection) {
    var randRotate, randTop, randLeft, currLink;
    randRotate = Math.floor(Math.random()*20)-10;

    if (!connection.publicProfileUrl) {
      connection.publicProfileUrl = '#';
    }
    currLink = $('<a/>').attr('href', connection.publicProfileUrl)
                        .attr('title', connection.firstName + ' ' + connection.lastName)
                        .attr('id', connection.id)
                        .attr('target', '_new')
                        .css('-moz-transform', 'rotate(' + randRotate + 'deg)')
                        .css('-webkit-transform', 'rotate(' + randRotate + 'deg)')
                        .css('transform', 'rotate(' + randRotate + 'deg)')
                        .css('position', 'absolute')
                        .css('background-image', 'url('+connection.pictureUrl+')')
                        .addClass('cxnPic');
    currLink.hover(function() {
      $(this).css('z-index', 1000);
    }, function() {
      $(this).css('z-index', '');
    });
    if (Math.floor(Math.random()*2)) { //upper
      if (Math.floor(Math.random()*4)) {
        // give the pic a 3/4 chance to not be under header,
        // so as to avoid a big pileup underneath header
        randLeft = Math.floor(Math.random()*(RIGHT_BOUND-HEADER_WIDTH))+HEADER_WIDTH;
        randTop = Math.floor(Math.random()*(HALF_HEIGHT-PIC_SIZE-30))+10;
      }
      else {
        randLeft = Math.floor(Math.random()*(HEADER_WIDTH));
        // underneath header ... don't allow them to go as high
        randTop = Math.floor(Math.random()*(HALF_HEIGHT-HEADER_HEIGHT-PIC_SIZE*5/4-30)) + (HEADER_HEIGHT + 20); // 30 is negative margin on timelineStuff
      }
      currLink.addClass('upper')
              .css('top', HALF_HEIGHT+PIC_SIZE)
              .css('left', randLeft)
              .attr('li-top', randTop);
      $('#upper .pics').append(currLink);
    }
    else { //add to lower
      randLeft = Math.floor(Math.random()*RIGHT_BOUND);
      randTop = Math.floor(Math.random()*(HALF_HEIGHT-PIC_SIZE-20)) + 10;
      currLink.addClass('lower')
              .css('left', randLeft)
              .css('top', PIC_SIZE*(-1.5))
              .attr('li-top', randTop);
      $('#lower .pics').append(currLink.addClass('lower'));
    }

    // 8Hnjm5JwNG
    // ylwwgeeCCH
    // easter egg
    if (connection.id === '8Hnjm5JwNG') {
      currLink.click(function(evt) {
        var img = $('#gk');
        evt.preventDefault();
        if (!img.length) {
          img = $('<img>').attr('id', 'gk')
                          .attr('src', '/img/gk.jpg');
          $('body').append(img);
          img.load(doGKAnimate);
        }
        else {
          img.css('left', '-650px');
          doGKAnimate();
        }
      });
    }
  },

  handleConnections = function(profiles) {
    var i, profile, position, company, length, cxn;
    cxnsLoaded = 1;
    if (!profileStored) {
      // don't load connections before profile is done being stored.
      // rare, but better safe than sorry!
      myConnections = profiles;
      return;
    }
    if (!profiles.values || !profiles._total) {
      showErrorMsg('It doesn\'t look like you have any connections yet.',
                   'Here are some ',
                   'people you may know.',
                   'http://www.linkedin.com/pymk-results');
      return;
    }
    for (i=0; i<profiles._total; ++i) {
      cxn = profiles.values[i];
      if (cxn.id !== myProfileId && cxn.pictureUrl) {
        // only store employee if has pictureUrl
        storeConnection(cxn);
        // pic doesn't exist; let's create it
        if (!$('#' + cxn.id).length) {
          createCxnPic(cxn);
        }
        addEducationToPositions(cxn);
      }
      else {
        //profiles.values.splice(i--, 1);
      }
    }
    socket.send({
      type: 'filterConnections',
      profiles: profiles,
      sessionId: mySessionId
    });
  },

  doGKAnimate = function() {
    var img = $('#gk');
    img.css('left', '-650px')
       .show();
    img.animate({ left: $(window).width() }, {
      complete: function() {
        img.hide();
      }
    });
  },

  doPlay = function() {
    var iconLeft, dur, totalDur, active, className,
        speeds = { slow     : 35000,
                   med      : 25000,
                   fast     : 8000,
                   realfast : 2000 };
    $(this).text('Pause');
    myPicLeft = myPicElem.position().left;
    active = speedElem.children('.active');
    className = active.attr('class').replace(/\s?active\s?/, '');
    totalDur = speeds[className];
    dur = (RIGHT_BOUND - myPicLeft)*totalDur/RIGHT_BOUND;
    myPicElem.animate({ left: RIGHT_BOUND + 'px' },
    {
      duration: dur,
      easing: 'linear',
      step: function(now, fx) {
        doDrag(now);
      },
      complete: function() {
        playBtn.text('Play');
      }
    });
  },

  doPause = function() {
    $(this).text('Play');
    myPicElem.stop(stop);
  },

  fixOverflow = function() {
    var _this = $(this);
    if (_this.width() + _this.position().left > TL_WIDTH) {
      _this.css('left', '');
      _this.css('right', '0');
    }
  },

  onLinkedInAuth = function() {
    // hide signin
    signinElem.fadeTo('fast', 0);
    signinElem.hide();
    // show logo and loading
    loadingElem.show();
    loadingElem.fadeTo('slow', 1);
    logoElem.show();
    logoElem.fadeTo('slow', 1);
    // get own profile
    IN.API.Raw("/people/~:(id,first-name,last-name,positions,picture-url,educations)").result(handleOwnProfile);
    //IN.API.Raw("/people/~:(id,first-name,last-name,positions,picture-url)").result(handleOwnProfile);
    // Pull in connection data
    IN.API.Raw("/people/~/connections:(id,first-name,last-name,positions,picture-url,public-profile-url,educations)").result(handleConnections);
  };

  onLinkedInLoad = function () {
    // hide loading
    loadingElem.fadeTo('slow', 0, function() {
      loadingElem.children('p').text('Loading connections...');
    });
    loadingElem.hide();
    // show signin
    signinElem.show();
    signinElem.fadeTo('slow', 1);
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };

  socket = new io.Socket(null, {port: PORT, rememberTransport: false});
  socket.connect();

  // avoid problem where linkedin profile returns before we are done
  // connecting through socket.io
  socket.on('connect', function() {
    ioConnected = 1;
    if (ownProfile) {
      // profile came back first
      handleOwnProfile(ownProfile);
    }
  });
  socket.on('message', function(message) {
    if (message.type !== 'undefined') {
      if (message.type === 'storeOwnProfileComplete') {
        mySessionId = message.sessionId;
        //handle connections
        profileStored = 1;
        if (cxnsLoaded) {
          handleConnections(myConnections);
        }
      }
      else if (message.type === 'filterConnectionsResult') {
        myCoworkers = message.coworkers;
        // fade out loading
        loadingElem.fadeTo('fast', 0);
        loadingElem.hide();
        // show body
        tlStuffElem.show();
        // detect and fix div overflow for dates/infos!
        // need to wait til we're here since we're display:none until now.
        $('#timeline .date span').each(fixOverflow);
        $('.infoBlock').each(fixOverflow);
        tlStuffElem.fadeTo('slow', 1);
      }
    }
  });

  // Browser event handlers.

  playBtn.click(function() {
    if ($(this).text() === 'Play') {
      doPlay.apply(this);
    }
    else {
      doPause.apply(this);
    }
  });

  speedElem.children().click(function(evt) {
    var _this = $(this);
    if (_this.hasClass('active')) { return evt.preventDefault(); }
    speedElem.children('.hide').removeClass('hide');
    speedElem.children('.active')
             .removeClass()
             .addClass(_this.attr('class') + ' active');
    speedElem.find('.active a').text(_this.text());
    _this.addClass('hide');
    speedElem.removeClass('hover');
    evt.preventDefault();
  }),

  speedElem.hover(function() {
    speedElem.addClass('hover');
  },
  function() {
    speedElem.removeClass('hover');
  });

  $('#printCoworkers').click(function() {
    console.log(myCoworkers);
  });
  $('#printCompBtn').click(function() {
    console.log(myCompanies);
  });

});
