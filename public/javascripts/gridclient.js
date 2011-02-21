var socket = null,
    grid = null,
    mouseIsDown = false,
    WHITE = '#fff',
    BLACK = '#000';

$(document).ready(function() {

  grid  = document.getElementById('grid');
  socket = new io.Socket(null, {port: 80, rememberTransport: false});
  socket.connect();

  socket.on('message', function(obj) {
    if ('type' in obj) {
      switch(obj.type) {
        case 'toggle':
          toggleCell(obj);
          break;
        case 'toggleOn':
          obj.state = 1;
          toggleCell(obj);
          break;
        case 'clear':
          $('#grid ul li').removeClass('toggled');
          break;
      }
    }
    else if ('grid' in obj && obj.grid) {
      for (var i=0; i<obj.grid.length; ++i) { // i: columns
        for (var j=0; j<obj.grid[i].length; ++j) { // j: rows
          if (obj.grid[i][j] != 0) {
            var cell = getCellByCoord(i, j);
            toggleCell({ cell: cell });
          }
        }
      }
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
    var elem = $(evt.target),
        elemCoord;
    if (elem.get(0).tagName.toLowerCase() !== 'li') {
      return;
    }

    elemCoord = getCoordByCell(elem);

    mouseIsDown = true;
    if (!elem.hasClass('toggled')) {
      toggleCell({ cell: elem });
      socket.send({ type: 'toggle', x: elemCoord.x, y: elemCoord.y });
    }
    return false;
  });

  $('#grid').mousemove(function(evt) {
    var el = $(evt.target);

    if (mouseIsDown && el.get(0).tagName.toLowerCase() === 'li' && !el.hasClass('toggled')) {
      var elemCoord = getCoordByCell(el);
      toggleCell({ cell: el });
      socket.send({ type: 'toggleOn', x: elemCoord.x, y: elemCoord.y });
    }
  });

  $('body').mouseup(function(evt) {
    mouseIsDown = false;
  });

  $('#clearbtn').click(function(evt) {
    $('#grid ul li').removeClass('toggled');
    socket.send({ type: 'clear' });
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
  var cell = null;
  var state = -1;

  if ('cell' in cellInfo && cellInfo.cell) {
    cell = $(cellInfo.cell);
  }
  else if ('x' in cellInfo && 'y' in cellInfo) {
    cell = getCellByCoord(cellInfo.x, cellInfo.y);
  }

  state = cell.hasClass('toggled') ? 0 : 1;

  if ('state' in cellInfo) {
    state = cellInfo.state;
  }

  if (state) {
    cell.addClass('toggled');
  }
  else {
    cell.removeClass('toggled');
  }
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
