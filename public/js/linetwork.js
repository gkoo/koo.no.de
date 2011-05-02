var onLinkedInLoad;

$(function() {
  var myAppView,

  // model for ConnectionPic
  Connection = Backbone.Model.extend({
    firstName   : '',
    lastName    : '',
    id          : '',
    pictureUrl  : '#',
    hidden      : 0
  }),

  // model for ConnectionsView
  Connections = Backbone.Collection.extend({
    model: Connection,
    hideCxnAt: function(idx) {
      var cxn = this.at(idx);
      cxn.set({ 'hidden': 1 });
      return cxn;
    }
  }),

  FeatConnections = Connections.extend({
    id: 'featured'
  }),

  // view for Connection
  ConnectionPic = Backbone.View.extend({
    tagName:    'a',
    className:  'cxnPic',
    initialize: function() {
      if (this.model.get('pictureUrl')) {
        // only care about them if they have a picture
        $(this.el).attr('href', '#')
                  .addClass(this.model.get('id'))
                  .attr('title',
                        this.model.get('firstName') + ' ' + this.model.get('lastName'));
      }
    },
    render: function() {
      var pictureUrl = this.model.get('pictureUrl');

      if (pictureUrl) {
        $(this.el).css('background-image', 'url('+pictureUrl+')');
      }
      else {
        $(this.el).addClass('hide');
      }
      return this;
    }
  }),

  // view for Connections
  ConnectionsView = Backbone.View.extend({
    tagName: 'div',
    initialize: function(options) {
      var _this = this;
      this._connectionPicViews = [];

      _(this).bindAll('doAdd'); // run this function in the scope of ConnectionsView

      if (this.collection) {
        this.collection.each(function(connection) {
          _this._connectionPicViews.push(new ConnectionPic({
            model: connection
          }));
        });
        this.collection.bind('add', this.doAdd);
        this.collection.bind('hide', function(cxn) {
          _this.$('.'+cxn.get('id')).css('display', 'none');
        });
      }
    },
    render:  function() {
      var _this = this;
      $(this.el).empty();
      _(this._connectionPicViews).each(function(cpView) {
        $(_this.el).append(cpView.render().el);
      });
      return this;
    },
    doAdd: function(newCxn) {
      var pos,
          newPic = new ConnectionPic({ model: newCxn });
      this._connectionPicViews.push(newPic);
      pos = this._connectionPicViews.length-1;
      $(this.el).append(newPic.render().el);
      return this;
    }
  }),

  // top-level view, acts kind of like controller
  AppView = Backbone.View.extend({
    id: 'main',
    events: {
      'click #featureBtn' : 'doFeature'
    },
    doFeature: function() {
      var idx = 0,
          cxn = this.allCxns.at(idx);
      this.allCxns.trigger('hide', cxn);

      // update featured connections
      this.ftCxns.add(cxn);
    }
  }),

  connectionCallback = function(connectionsResult) {
    var allCxns, allCxnsView;
    if (connectionsResult && connectionsResult.values && connectionsResult.values.length) {
      // set up allCxns model
      myAppView.allCxns = allCxns = new Connections(connectionsResult.values); // collection
      myAppView.allCxnsView = allCxnsView = new ConnectionsView({
        collection: myAppView.allCxns,
        el: $('#all-pics')
      }); // view for collection
      allCxnsView.render(); // render view
    }
    else {
      // TODO: error handling
    }
  },

  onLinkedInAuth = function() {
    var fields = ['first-name',
                  'last-name',
                  'picture-url',
                  'id']
    myAppView = new AppView({ el: $('#main') });
    IN.API.Connections("me")
      .fields(fields)
      .result(connectionCallback);
    myAppView.ftCxns = new FeatConnections();
    myAppView.ftCxnsView = new ConnectionsView({ el: $('#featured-pics'),
                                                 collection: myAppView.ftCxns });
  };

  onLinkedInLoad = function () {
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };

});
