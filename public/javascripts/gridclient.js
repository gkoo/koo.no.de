var socket = null,
    grid = null,
    mouseIsDown = false,
    currColorClass = 'black',
    username = '',
    PLAYER_ID_PREFIX = 'player-';

$(document).ready(function() {

  grid  = document.getElementById('grid');
  socket = new io.Socket(null, {port: 8080, rememberTransport: false});
  socket.connect();

  socket.on('message', function(obj) {
    if ('type' in obj) {
      switch(obj.type) {
        case 'toggle':
          toggleCell(obj);
          addLabel(obj);
          break;
        case 'clear':
          $('#grid ul li').removeClass();
          break;
      }
    }
    else if ('grid' in obj) {
      if (obj.grid) {
        // Do initialization of grid, if there is any to be done.
        for (var i=0; i<obj.grid.length; ++i) { // i: columns
          for (var j=0; j<obj.grid[i].length; ++j) { // j: rows
            if (obj.grid[i][j] != 0) {
              var cell = getCellByCoord(i, j);
              toggleCell({ cell: cell, currColorClass: obj.grid[i][j] });
            }
          }
        }
      }
      $('#wrapper').children(':first-child').removeClass('loading');
    }
    else if ('msg' in obj) {
      alert (obj.msg);
    }
  });

  /*
  $('#grid ul li').click(function(evt) {
    var elem      = evt.target,
        elemCoord = getCoordByCell(elem);

    toggleCell({ cell: elem });
    socket.send({ type: 'toggle', x: elemCoord.x, y: elemCoord.y });
    evt.stopPropagation();
  });
  */

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
      socket.send({ type: 'clear' });
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
      var yourColor = $('#colorMsg').children('div');
      currColorClass = target.attr('class');
      yourColor.css('display', 'none');
      yourColor.removeClass();
      yourColor.addClass(currColorClass);
      yourColor.css('display', 'block');
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

var toggleCell = function(cellInfo) {
  var cell = getCellFromCellInfo(cellInfo);
  if (!cell) { return; }

  cell.css('display', 'none');
  cell.removeClass();
  cellInfo.currColorClass ? cell.addClass(cellInfo.currColorClass) : cell.addClass(currColorClass);
  cell.css('display', 'inline-block');
};

var getCellByCoord = function(x, y) {
  // blah! nth-child is 1-indexed. why??
  var row = $(grid).children('li:nth-child('+(y+1)+')'),
      col = null;
  row = row.children('ul');
  col = row.children('li:nth-child('+(x+1)+')');
  return col;
};

var getCoordByCell = function(el) {
  var innerGrid = $(el).parent(),
      x         = innerGrid.children('li').index(el),
      y         = $(grid).children('li').index(innerGrid.parent());

  return { x: x, y: y };
};

var getCellFromCellInfo = function(cellInfo) {
  var cell = null;

  if ('cell' in cellInfo && cellInfo.cell) {
    cell = $(cellInfo.cell);
  }
  else if ('x' in cellInfo && 'y' in cellInfo) {
    cell = getCellByCoord(cellInfo.x, cellInfo.y);
  }
  return cell;
}

var doDraw = function(el) {
  if (mouseIsDown && isDrawable(el)) {
    var elemCoord = getCoordByCell(el);

    toggleCell({ cell: el });
    socket.send({
      type: 'toggle',
      x: elemCoord.x,
      y: elemCoord.y,
      currColorClass: currColorClass,
      username: username
    });
  }
};

// Adds a name label to the cell that was just drawn.
var addLabel = function(cellInfo) {
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
}

/*
 * isDrawable
 * ==========
 * Returns false if the cell matches the user's current color. Otherwise,
 * returns true.
 */
var isDrawable = function(el) {
  return el.get(0).tagName.toLowerCase() === 'li' && !el.hasClass(currColorClass);
};

var handleNameChange = function() {
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
    nameElem.show()
  }
};
