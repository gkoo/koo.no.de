var socket            = null,
    grid              = null,
    mouseIsDown       = false,
    username          = '',
    PLAYER_ID_PREFIX  = 'player-',
    APP_NAME          = 'grid',
    buffer            = [],
    BLACK             = 0,
    RED               = 1,
    GREEN             = 2,
    BLUE              = 3,
    YELLOW            = 4,
    WHITE             = 5,
    COLORS            = ['black', 'red', 'green', 'blue', 'yellow', 'white'],
    currColor    = BLACK,

getCellByCoord = function(x, y) {
  // blah! nth-child is 1-indexed. why??
  var row = $(grid).children('li:nth-child('+(y+1)+')'),
      col = null;
  row = row.children('ul');
  col = row.children('li:nth-child('+(x+1)+')');
  return col;
},

getCellFromCellInfo = function(cellInfo) {
  var cell = null;

  if ('cell' in cellInfo && cellInfo.cell) {
    cell = $(cellInfo.cell);
  }
  else if ('x' in cellInfo && 'y' in cellInfo) {
    cell = getCellByCoord(cellInfo.x, cellInfo.y);
  }
  return cell;
},

/*
 * toggleCell
 * ==========
 *
 * Switches the state of the cell to the opposite state.
 *
 * Takes in one argument: cellInfo of type Object.
 * You can either pass in the HTML element or the coordinates
 * for the HTML element you want to toggle.
 */
toggleCell = function(cellInfo) {
  var cell = getCellFromCellInfo(cellInfo);
  if (!cell) { return; }

  if (typeof cellInfo.currColor !== 'undefined') {
    cell.attr('class', COLORS[cellInfo.currColor]);
  }
  else {
    cell.attr('class', COLORS[currColor]);
  }
},

getCoordByCell = function(el) {
  var innerGrid = $(el).parent(),
      x         = innerGrid.children('li').index(el),
      y         = $(grid).children('li').index(innerGrid.parent());

  return { x: x, y: y };
},

/*
 * isDrawable
 * ==========
 * Returns false if the cell matches the user's current color. Otherwise,
 * returns true.
 */
isDrawable = function(el) {
  return el.get(0).tagName.toLowerCase() === 'li' && !el.hasClass(COLORS[currColor]);
},

doDraw = function(el) {
  if (mouseIsDown && isDrawable(el)) {
    var elemCoord = getCoordByCell(el),
        color = currColor || WHITE;

    toggleCell({ cell: el, currColor: color });
    buffer.push({
      x:    elemCoord.x,
      y:    elemCoord.y,
      currColor: currColor,
      username: username
    });
  }
},

// Adds a name label to the cell that was just drawn.
addLabel = function(cellInfo) {
  var cell, newLabel;

  if (typeof cellInfo.username === 'undefined' || !cellInfo.username) {
    return;
  }
  cell = getCellFromCellInfo(cellInfo);

  existingName = $('#' + PLAYER_ID_PREFIX + cellInfo.playerid);
  if (existingName) {
    existingName.remove();
  }

  newLabel = $('<div>').text(cellInfo.username)
                       .addClass('nameLabel')
                       .attr('id', PLAYER_ID_PREFIX + cellInfo.playerId);
  cell.append(newLabel);

  setTimeout(function() {
    if (newLabel) { newLabel.remove(); }
  }, 2000);
},

handleNameChange = function() {
  var newName = $('#editNameText').val(), // user input! be sure to escape!
      MAX_NAME_LENGTH = 20;
  if (newName.length > MAX_NAME_LENGTH) {
    alert('Sorry, your name can\'t be more than ' + MAX_NAME_LENGTH + ' characters long.');
  }
  else {
    // Change name and hide field.
    username = newName;
    nameElem = $('#username');
    $('#editNameField').hide();
    if (newName) {
      nameElem.children('span').text(newName).show();
    }
    else {
      nameElem.children('span').hide();
    }
    nameElem.show();
  }
};

$(function() {

  var togglePixel = function(data) {
    toggleCell(data);
    addLabel(data);
  };

  grid  = document.getElementById('grid');
  socket = new io.connect('http://www.gordonkoo.com');

  // Receives a buffer of pixels to toggle,
  // and calls togglePixel on each pixel data.
  socket.on('togglePixels', function(data) {
    var i, len, toggleData;
    for (i=0,len=data.length; i<len; ++i) {
      toggleData = data[i];
      togglePixel(toggleData);
    }
  });

  socket.on('clear', function() {
    $('#grid ul li').removeClass();
  });

  socket.on('grid', function(data) {
    if (data !== null) {
      // Do initialization of grid, if there is any to be done.
      for (var i=0; i<data.length; ++i) { // i: columns
        for (var j=0; j<data[i].length; ++j) { // j: rows
          var cell = getCellByCoord(i, j);
          if (typeof data[i][j] !== 'undefined' && data[i][j] !== WHITE) {
            toggleCell({ cell: cell, currColor: data[i][j] });
          }
        }
      }
    }
    $('.loading').removeClass('loading');

    // send toggled pixels to server on a set interval
    setInterval(function() {
      if (buffer.length) {
        socket.emit('togglePixels', buffer);
        buffer = [];
      }
    }, 100);
  });

  $('#grid').mousedown(function(evt) {
    var el = $(evt.target),
        elemCoord;
    if (el.get(0).tagName.toLowerCase() !== 'li') {
      return;
    }

    mouseIsDown = true;
    doDraw(el);
    evt.preventDefault();
  });

  $('#grid').mousemove(function(evt) {
    var el = $(evt.target);
    doDraw(el);
  });

  $('body').mouseup(function(evt) {
    mouseIsDown = false;
  });

  /* ======= CONTROLS ======= */

  $('#controls').click(function(evt) {
    var target = $(evt.target);
    if (target.attr('id') === 'clearBtn') {
      $('#grid ul li').removeClass();
      socket.emit('clear');
    }
    // Initiate setting name.
    else if (target.attr('id') === 'editNameBtn') {
      $('#username').hide();
      $('#editNameField').show();
    }
    // Save changes to username.
    else if (target.attr('id') === 'editNameSubmit') {
      handleNameChange();
    }
    else if (target.is('a')) {
      var yourColor = $('#colorMsg').children('div'),
          colorClass = target.attr('class'),
          i, len;

      for (i=0,len=COLORS.length; i<len; ++i) {
        if (colorClass === COLORS[i]) {
          currColor = i;
          break;
        }
      }
      yourColor.attr('class', COLORS[currColor]);
      evt.preventDefault();
    }
  });

  $('#editNameText').keypress(function(evt) {
    // If user presses 'Enter' key, submit name change.
    if (evt.keyCode == '13') {
      handleNameChange();
    }
  });

});

