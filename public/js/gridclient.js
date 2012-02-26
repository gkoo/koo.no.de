// TODO: use localstorage to save name, etc.
var debug = 0,
    COLORS            = { BLACK  : 0,
                        RED    : 1,
                        GREEN  : 2,
                        BLUE   : 3,
                        YELLOW : 4,
                        WHITE  : 5 },
    COLOR_CLASSES     = ['black', 'red', 'green', 'blue', 'yellow', 'white'],



/* GridControls
 * ============
 * View for the grid controls. Provides controls for user such as username,
 * selected color, and clearing grid.
 */
GridControls = Backbone.View.extend({
  el: $('#controls'),

  initialize: function () {
    _.extend(this, Backbone.Events);
    _.bindAll(this, 'doClear',
                    'showNameField',
                    'pickColor',
                    'nameKeyPress',
                    'handleNameChange');
  },

  events: {
    'click #clearBtn': 'doClear',
    'click #editNameBtn': 'showNameField',
    'click #editNameSubmit': 'handleNameChange',
    'click .color': 'pickColor',
    'keypress #editNameText': 'nameKeyPress'
  },

  doClear: function () {
    this.trigger('controls:clear');
  },

  // Initiate setting name.
  showNameField: function () {
    $('#username').hide();
    $('#editNameField').show();
  },

  pickColor: function(evt) {
    var yourColorEl = $('#colorMsg').children('div'),
        colorClass = $(evt.target).attr('class'),
        yourColor = colorClass.split(' ')[1],
        i, len;

    for (i = 0,len = COLOR_CLASSES.length; i<len; ++i) {
      if (yourColor === COLOR_CLASSES[i]) {
        this.trigger('controls:colorChange', i);
        break;
      }
    }
    if (i > len) {
      console.log('Didn\'t find color. Something is wrong!');
    }
    yourColorEl.attr('class', COLOR_CLASSES[i]);
    evt.preventDefault();
  },

  nameKeyPress: function(evt) {
    // If user presses 'Enter' key, submit name change.
    if (evt.keyCode === 13) {
      this.handleNameChange();
    }
  },

  handleNameChange: function () {
    var newName = $('#editNameText').val(), // user input! be sure to escape!
        nameElem,
        MAX_NAME_LENGTH = 20;
    if (newName.length > MAX_NAME_LENGTH) {
      alert('Sorry, your name can\'t be more than ' + MAX_NAME_LENGTH + ' characters long.');
    }
    else {
      // Change name and hide field.
      this.trigger('controls:newName', newName);
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
  }
}),

/* GridView
 * ========
 * View for the grid. Handles drawing of pixels and everything within the
 * grid.
 *
 * TODO: only add mousemove event as necessary
 */
GridView = Backbone.View.extend({
  el: $('#grid'),

  mouseIsDown: false,

  currColor: 0,

  drawSleep: 0, // timeout for drawing

  userInfo: { id: Math.floor(Math.random()*999999),
              name: '' },

  DRAW_INTERVAL_DURATION: 5,

  initialize: function () {
    var _this = this;
    _.extend(this, Backbone.Events);
    _.bindAll(this, 'handleMouseDown',
                    'handleMouseMove',
                    'handleCells',
                    'addLabel',
                    'getCellByCoord',
                    'getCoordByCell',
                    'getCellFromCellInfo',
                    'toggleCell',
                    'isDrawable',
                    'doDraw',
                    'changeColor',
                    'changeName',
                    'clearGrid');

    $('body').mouseup(function () {
      _this.mouseIsDown = false;
    });
  },

  events: {
    'mousedown': 'handleMouseDown',
    'mousemove': 'handleMouseMove'
  },

  handleMouseDown: function(evt) {
    var el = $(evt.target),
        elemCoord;

    if (el.get(0).tagName.toLowerCase() !== 'li') {
      return;
    }

    this.mouseIsDown = true;
    this.doDraw(el);
    evt.preventDefault();
  },

  handleMouseMove: function(evt) {
    var el = $(evt.target);
    if (this.mouseIsDown) { this.doDraw(el); }
  },

  getUserInfo: function () {
    return this.userInfo;
  },

  /* handleCells
   * ===========
   * Take cell data from the server and render them on the grid.
   *
   * @data: array of cell objects
   */
  handleCells: function(data) {
    var i, len, toggleData;
    for (i = 0,len = data.length; i<len; ++i) {
      this.toggleData = data[i];
      this.toggleCell(data[i]);
      this.addLabel(data[i]);
    }
  },

  /* resetGrid
   * =========
   * Called on page load once grid state is received from server.
   */
  resetGrid: function(data) {
    var i;
    if (data !== null) {
      // Do initialization of grid, if there is any to be done.
      for (i = 0; i<data.length; ++i) { // i: columns
        for (var j = 0; j<data[i].length; ++j) { // j: rows
          var cell = this.getCellByCoord(i, j);
          if (typeof data[i][j] !== 'undefined' && data[i][j] !== COLORS.WHITE) {
            this.toggleCell({ cell: cell, currColor: data[i][j] });
          }
        }
      }
    }
  },

  // Adds a name label to the cell that was just drawn.
  addLabel: function(cellInfo) {
    var cell, newLabel, PLAYER_ID_PREFIX = 'player-';

    if (typeof cellInfo.username === 'undefined' || !cellInfo.username) {
      return;
    }
    cell = this.getCellFromCellInfo(cellInfo);

    existingName = $('#' + PLAYER_ID_PREFIX + cellInfo.userId);
    if (existingName) {
      existingName.remove();
    }

    // TODO: create a more efficient way of adding a label
    newLabel = $('<div>').text(cellInfo.username)
                         .addClass('nameLabel')
                         .attr('id', PLAYER_ID_PREFIX + cellInfo.userId);
    cell.append(newLabel);

    setTimeout(function () {
      if (newLabel) { newLabel.remove(); }
    }, 2000);
  },

  /*
   * getCellByCoord
   * ==============
   * Given an {x,y} pair, get the DOM element "cell"
   */
  getCellByCoord: function(x, y) {
    // blah! nth-child is 1-indexed. why??
    var row = this.$el.children('li:nth-child('+(y+1)+')').children('ul'),
        col = row.children('li:nth-child('+(x+1)+')');
    return col;
  },

  /*
   * getCoordByCell
   * ==============
   * Given a the DOM element "cell", get the {x,y} pair
   */
  getCoordByCell: function(el) {
    var innerGrid = $(el).parent(),
        x         = innerGrid.children('li').index(el),
        y         = this.$el.children('li').index(innerGrid.parent());

    return { x: x,
             y: y };
  },

  /*
   * getCellFromCellInfo
   * ===================
   * Returns the DOM element associated with the cellInfo.
   * If no element can be found, returns null.
   */
  getCellFromCellInfo: function(cellInfo) {
    var cell = null;

    if (typeof cellInfo.cell !== 'undefined') {
      // DOM element
      cell = $(cellInfo.cell);
    }
    else if (typeof cellInfo.x !== 'undefined' && typeof cellInfo.y !== 'undefined') {
      // x,y coordinate pair
      cell = this.getCellByCoord(cellInfo.x, cellInfo.y);
    }
    else {
      console.log('something is wrong.');
    }
    return cell;
  },

  /*
   * toggleCell
   * ==========
   * Switches the state of the cell to the opposite state.
   *
   * Takes in one argument: cellInfo of type Object.
   * You can either pass in the HTML element or the coordinates
   * for the HTML element you want to toggle.
   */
  toggleCell: function(cellInfo) {
    var cell = this.getCellFromCellInfo(cellInfo);
    if (!cell) { return; }

    if (typeof cellInfo.currColor !== 'undefined') {
      cell.attr('class', COLOR_CLASSES[cellInfo.currColor]);
    }
    else {
      cell.attr('class', COLOR_CLASSES[this.currColor]);
    }
  },

  /*
   * isDrawable
   * ==========
   * Returns false if the cell matches the user's current color. Otherwise,
   * returns true.
   */
  isDrawable: function(el) {
    return el.get(0).tagName.toLowerCase() === 'li' && !el.hasClass(COLOR_CLASSES[this.currColor]);
  },

  /* doDraw
   * ======
   * Entry point for drawing the cell.
   */
  doDraw: function(el) {
    var elemCoord, color, _this = this;

    if (!this.drawSleep) {
      this.drawSleep = 1;

      if (this.mouseIsDown && this.isDrawable(el)) {
        elemCoord = this.getCoordByCell(el);
        color = this.currColor || COLORS.BLACK;

        this.toggleCell({ cell: el, currColor: color });
        this.trigger('cell:toggle', {
          x:          elemCoord.x,
          y:          elemCoord.y,
          currColor:  color,
          username:   this.userInfo.name,
          userId:     this.userInfo.id
        });
      }

      setTimeout(function () {
        _this.drawSleep = 0;
      }, this.DRAW_INTERVAL_DURATION);
    }
    else {
      console.log('tried to draw but sleeping');
    }
  },

  changeColor: function(colorCode) {
    if (colorCode >= 0 && colorCode < COLOR_CLASSES.length) {
      this.currColor = colorCode;
    }
    else {
      console.log('Invalid color code.');
    }
  },

  changeName: function(name) {
    this.userInfo.name = name;
  },

  clearGrid: function () {
    this.$el.find('li').removeClass();
  }
}),

/* Grid
 * ====
 * Controller. Facilitates communication between GridView and GridControls
 */
Grid = function () {
  var _this = this,
      buffer = [];
  this.view = new GridView();
  this.controls = new GridControls();

  this.pushCellToBuffer = function(data) {
    buffer.push(data);
  };

  this.doClear = function () {
    this.view.clearGrid();
    this.socket.emit('clear');
  };

  this.setupSocket = function () {
    var socketUrl = debug ? 'http://localhost' : 'http://www.gordonkoo.com';
    this.socket = new io.connect(socketUrl);

    // Receives a buffer of pixels to toggle,
    // and calls toggleCell on each pixel data.
    this.socket.on('togglePixels', this.view.handleCells);

    this.socket.on('clear', this.view.clearGrid);

    this.socket.on('grid', function(data) {
      _this.view.resetGrid(data);
      $('.loading').removeClass('loading');

      // send toggled pixels to server on a set interval
      setInterval(function () {
        if (buffer.length) {
          _this.socket.emit('togglePixels', buffer);
          buffer = [];
        }
      }, 100);
    });
  };

  this.addGridListeners = function () {
    this.view.on('cell:toggle', this.pushCellToBuffer);
    this.controls.on('controls:clear', this.doClear);
    this.controls.on('controls:colorChange', this.view.changeColor);
    this.controls.on('controls:newName', this.view.changeName);
  };

  this.init = function () {
    _.extend(this, Backbone.Events);
    _.bindAll(this, 'doClear', 'pushCellToBuffer');
    this.setupSocket();
    this.addGridListeners();
    return this;
  };

  return this.init();
};

$(function () {
  var grid = new Grid();
});
