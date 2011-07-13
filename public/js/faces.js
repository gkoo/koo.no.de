// TODO: cache results on server
// TODO: detect when one of the filters has no results

var onLinkedInLoad;
$(function() {
  var appView,
      REDX = 'redx',
      GREENCHECK = 'greencheck',
      // DEV
      // face_api_key = '41be1e8bc43f9b5d79b421cd8995ba5f',
      // PROD
      face_api_key = 'e736bb672063697ac00f2bcc14f291ba',
      faceClient = new Face_ClientAPI(face_api_key),
      cxnList = $('.cxns'),
      ownProfile,
      connections,

  ConnectionModel = Backbone.Model.extend(),

  ConnectionView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render', 'renderPhotoAttrs', 'renderAttr');
      $(this.el).addClass('cxn');
      this.model.bind('change', this.render);
    },
    tagName: 'li',
    className: 'cxn',
    render: function() {
      var img = $('<img>').attr('src', this.model.get('pictureUrl')),
          nameLink = $('<a>').text(this.model.get('firstName') + ' ' + this.model.get('lastName'))
                             .attr({ 'href': this.model.get('siteStandardProfileRequest').url,
                                     'target': '_new' }),
          nameElem = $('<div>').addClass('name')
                               .append(nameLink),
          photoAttrs = this.model.get('photoAttributes'),
          el = $(this.el),
          attributesElem;
      if (this.model.get('isSelf')) {
        el.addClass('self');
      }
      el.empty().append(nameElem).append(img);
      if (photoAttrs) {
        this.attrInfo = $('<ul>').addClass('attrInfo');
        if (photoAttrs.face === false) {
          this.renderAttr('???');
          this.renderAttr('???');
          this.renderAttr('???');
          el.addClass('nophoto');
        }
        else {
          el.append(this.renderPhotoAttrs(photoAttrs));
        }
        el.append(this.attrInfo);
      }
      return el;
    },
    renderPhotoAttrs: function(photoAttrs) {
      var glassesVal = photoAttrs.glasses.value,
          smileVal = photoAttrs.smiling.value,
          el = $(this.el);
      if (photoAttrs.mood) {
        this.renderAttrClass(photoAttrs.mood.value);
        el.addClass(photoAttrs.mood.value);
      }
      if (photoAttrs.glasses) {
        this.renderAttrClass(glassesVal === 'true' ? GREENCHECK : REDX);
        el.addClass(glassesVal === 'true' ? 'glasses' : 'noglasses');
      }
      if (photoAttrs.smiling) {
        this.renderAttrClass(smileVal === 'true' ? GREENCHECK : REDX);
        el.addClass(smileVal === 'true' ? 'smile' : 'nosmile');
      }
      return this.attrInfo;
    },
    renderAttrClass: function(className) {
      this.attrInfo.append($('<li>').addClass(className));
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
      this.el = $(this.el);
      this.$('.filterDropdown').attr('value', 'all-filter');
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
    },

    doFilter: function() {
      var filterVal = this.$('.filterDropdown').attr('value');
      this.$('.cxns').removeClass().addClass('cxns').addClass(filterVal);
    },

    events: {
      'change .filterDropdown': "doFilter"
    }
  }),

  callFaceDetect = function(urls) {
    faceClient.faces_detect(urls, appView.handleFaceResult);
  },

  processProfiles = function(profiles) {
    var i = 0,
        picUrlList = [],
        MAX_DETECT = 30, // Face API limits to 30 urls
        cxn, newPic, len;

    // purge all cxns with nonexistent/private pictures
    for (len = profiles.length; i<len; ++i) {
      cxn = profiles[i];
      if (typeof cxn.pictureUrl !== 'string' || cxn.pictureUrl === 'private') {
        // NONEXISTENT OR PRIVATE PICTURE
        profiles.splice(i, 1);
        --len;
        --i;
      }
    }
    i=0;
    appView.addCxns(profiles);
    while (i < len) {
      // all cxns should have picture at this point
      cxn = profiles[i];
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

  handleConnectionsResult = function(result) {
    if (!result || !result.values || result.values.length === 0 ) { console.log('no connections?'); return; }
    connections = result.values;
    if (ownProfile) {
      processProfiles(ownProfile.concat(connections));
    }
    else {
      connections = result.values;
    }
  },

  handleOwnProfile = function(result) {
    var ownProf;
    if (!result || !result.values || result.values.length === 0 ) { console.log('no own profile?'); return; }
    ownProf = result.values[0];
    if (!ownProf.pictureUrl) {
      console.log('no own picture!');
      return;
    }
    ownProf.isSelf = true; // set flag so we can detect self later
    ownProfile = result.values;
    if (connections) {
      processProfiles(ownProfile.concat(connections));
    }
  },

  onLinkedInAuth = function() {
    var fields = ['firstName','lastName','id','pictureUrl','site-standard-profile-request:(url)'];
    IN.API.Profile("me")
          .fields(fields)
          .result(handleOwnProfile);
    IN.API.Connections("me")
          .fields(fields)
          .result(handleConnectionsResult);
    $('.categories').show();
    $('.filter').show();
  };

  onLinkedInLoad = function() {
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };

  appView = new AppView();
});
