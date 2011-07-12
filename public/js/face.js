var onLinkedInLoad;
$(function() {
  var appView,
      faceClient = new Face_ClientAPI('41be1e8bc43f9b5d79b421cd8995ba5f');
      cxnList = $('.cxns');

  ConnectionModel = Backbone.Model.extend(),

  ConnectionView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render', 'renderPhotoAttrs', 'renderAttr');
      this.el = $(this.el).addClass('cxn');
      this.model.bind('change', this.render);
    },
    tagName: 'li',
    className: 'cxn',
    render: function() {
      var img = $('<img>').attr('src', this.model.get('pictureUrl')),
          nameElem = $('<div>').addClass('name').text(this.model.get('firstName') + ' ' + this.model.get('lastName')),
          photoAttrs = this.model.get('photoAttributes'),
          attributesElem;
      this.el.empty().append(nameElem).append(img);
      if (photoAttrs) {
        this.attrInfo = $('<ul>').addClass('attrInfo');
        if (photoAttrs.face === false) {
          this.renderAttr('???');
          this.renderAttr('???');
          this.renderAttr('???');
        }
        else {
          this.el.append(this.renderPhotoAttrs(photoAttrs));
        }
        this.el.append(this.attrInfo);
      }
      return this.el;
    },
    renderPhotoAttrs: function(photoAttrs) {
      if (photoAttrs.glasses) {
        this.renderAttr(photoAttrs.glasses.value);
      }
      if (photoAttrs.smiling) {
        this.renderAttr(photoAttrs.smiling.value);
      }
      if (photoAttrs.mood) {
        this.renderAttr(photoAttrs.mood.value);
      }
      return this.attrInfo;
    },
    renderAttr: function(text) {
      this.attrInfo.append($('<li>').text(text));
    }
  }),

  ConnectionList = Backbone.Collection.extend({
    model: ConnectionModel
  }),

  ConnectionListView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render', 'constructCxnView');
      this.cxnPicViews = [];
      this.collection.each(this.constructCxnView);
      this.render();
      this.el = $(this.el);
    },
    constructCxnView: function(cxn) {
      this.cxnPicViews.push(new ConnectionView({ model: cxn }));
    },
    render: function() {
      // Create a new ul and populate it first so we can insert
      // everything into DOM at once.
      var _this = this,
          tmpUl = $('<ul>').addClass('cxns');
      _.each(this.cxnPicViews, function(cxnPicView) {
        tmpUl.append(cxnPicView.render());
      });
      this.$('.cxns').remove();
      this.el.append(tmpUl);
    }
  }),

  AppView = Backbone.View.extend({
    el: document.getElementById('main'),

    initialize: function() {
      _.bindAll(this, 'handleFaceResult');
      this.cxnListElem = this.$('.cxnWrapper');
    },

    render: function() {
      this.cxnList.each(function(cxn) {
        cxn.render();
      });
    },

    addCxns: function(cxns) {
      this.cxnList = new ConnectionList(cxns); // collection of cxns
      this.cxnListView = new ConnectionListView({ el: this.$('.cxnWrapper'), collection: this.cxnList });
    },

    handleFaceResult: function(urls, response) {
      var i, len, photos, photo, cxn;
      //console.log(response);
      if (response.status !== 'success') {
        console.log('Status: ' + response.status);
        return;
      }
      for (i=0,photos=response.photos,len=photos.length; i<len; ++i) {
        photo = photos[i];
        cxn = this.cxnList.detect(function(cxn) {
          return cxn.get('pictureUrl') === photo.url;
        });
        if (!cxn) { console.log('connection not found. something\'s wrong.'); return; }
        if (!photo.tags || !photo.tags.length || !photo.tags[0].attributes || !photo.tags[0].attributes.glasses) {
          cxn.set({ 'photoAttributes': { face: false } });
        }
        else {
          cxn.set({ 'photoAttributes': photo.tags[0].attributes });
        }
        if (cxn.get('pictureUrl') !== photo.url) { alert('urls don\'t match; something is wrong'); }
      }
    }
  }),

  callFaceDetect = function(urls) {
    faceClient.faces_detect(urls, appView.handleFaceResult);
  },

  handleConnectionsResult = function(result) {
    var i = 0,
        picUrlList = [],
        MAX_DETECT = 30, // Face API limits to 30 urls
        values, cxn, newPic, len;

    if (!result || !result.values || result.values.length === 0 ) { console.log('no connections?'); return; }
    values = result.values;
    // purge all cxns with nonexistent/private pictures
    for (len = values.length; i<len; ++i) {
      cxn = values[i];
      if (typeof cxn.pictureUrl !== 'string' || cxn.pictureUrl === 'private') {
        // NONEXISTENT OR PRIVATE PICTURE
        values.splice(i, 1);
        --len;
        --i;
      }
    }
    i=0;
    appView.addCxns(values);
    while (i < len) {
      // all cxns should have picture at this point
      cxn = values[i];
      cxn.cid = cxn.id; // add cid property for Backbone
      picUrlList.push(cxn.pictureUrl);
      if (picUrlList.length === MAX_DETECT) {
        callFaceDetect(picUrlList.join(','));
        picUrlList = [];
      }
      ++i;
    }
    if (picUrlList.length) {
      // if there are any leftover pictures
      callFaceDetect(picUrlList.join(','));
    }
  },

  onLinkedInAuth = function() {
    IN.API.Connections("me")
      .fields(['firstName','lastName','id','pictureUrl'])
      .result(handleConnectionsResult);
  };

  onLinkedInLoad = function() {
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };

  appView = new AppView();
});
