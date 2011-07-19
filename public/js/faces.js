// TODO: cache results on server
// TODO: detect when one of the filters has no results

var onLinkedInLoad;
$(function() {
  var appView,
      NO              = 'no',
      YES             = 'yes',
      cxnList         = $('.cxns'),
      ownProfile,
      connections,

  ConnectionModel = Backbone.Model.extend(),

  ConnectionView = Backbone.View.extend({
    tagName: 'li',

    className: 'cxn',

    initialize: function() {
      _.bindAll(this, 'render', 'renderPhotoAttrs');
      $(this.el).addClass('cxn');
      this.model.bind('change', this.render);
    },

    render: function() {
      var img         = $('<img>').attr('src', this.model.get('pictureUrl')),
          firstName   = this.model.get('firstName') || '',
          lastName    = this.model.get('lastName') || '',
          sspr        = this.model.get('siteStandardProfileRequest'),
          profileUrl  = sspr && sspr.url ? sspr.url : '#',
          nameLink    = $('<a>').text([firstName, lastName].join(' '))
                                .attr({ 'href': profileUrl,
                                        'target': '_new' })
                                .addClass('profileLink'),
          picLink     = $('<a>').attr({ 'href': profileUrl,
                                        'target': '_new' })
                                .append(img)
                                .addClass('picLink'),
          nameElem    = $('<div>').addClass('name')
                                  .append(picLink)
                                  .append(nameLink),
          photoAttrs  = this.model.get('photoAttributes'),
          el          = $(this.el),
          attributesElem;
      if (this.model.get('isSelf')) {
        el.addClass('self');
      }
      el.empty().append(nameElem);
      if (photoAttrs) {
        this.attrInfo = $('<ul>').addClass('attrInfo');
        if (photoAttrs.face === false) {
          this.renderAttrClass('noattrs', 'first');
          this.renderAttrClass('noattrs');
          this.renderAttrClass('noattrs', 'last');
          el.addClass('noattrs');
        }
        else {
          el.append(this.renderPhotoAttrs(photoAttrs));
        }
        el.prepend(this.attrInfo);
      }
      return el;
    },

    renderPhotoAttrs: function(photoAttrs) {
      var glassesVal = photoAttrs.glasses.value,
          smileVal = photoAttrs.smiling.value,
          el = $(this.el);
      if (photoAttrs.mood) {
        this.renderAttrClass(photoAttrs.mood.value, 'first');
        el.addClass(photoAttrs.mood.value);
      }
      if (photoAttrs.glasses) {
        this.renderAttrClass(glassesVal === 'true' ? YES : NO);
        el.addClass(glassesVal === 'true' ? 'glasses' : 'noglasses');
      }
      if (photoAttrs.smiling) {
        this.renderAttrClass((smileVal === 'true' ? YES : NO), 'last');
        el.addClass(smileVal === 'true' ? 'smile' : 'nosmile');
      }
      return this.attrInfo;
    },

    renderAttrClass: function(type, secondaryClass) {
      this.attrInfo.append($('<li>').append($('<img>').addClass([type, secondaryClass].join(' '))
                                                      .attr({ alt: type,
                                                              src: ['/img/emoticons/', type, '.png'].join('') }))
                                    .addClass(secondaryClass));
    },
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

  TopTitleModel = Backbone.Model.extend(),

  TopTitleListView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'handleTopTitleData');
    },
    handleTopTitleData: function(data) {
      var topTitles = data.topTitles, // array of objects
          dataElem = this.$('.data'),
          i, j, len, ul, li, attr, values, titleLen;

      for (i=0, len = topTitles.length; i<len; ++i) {
        ul = $('<ul>');
        attr = topTitles[i];
        ul.append($('<li>').text(attr.name));
        values = attr.value;
        for (j=0, titleLen = values.length; j<titleLen; j+=2) {
          li = $('<li>').text([values[j+1], values[j]].join(': '));
          ul.append(li);
        }
        dataElem.append(ul);
      }
      this.model.set({ initialized: true });
    }
  }),

  AppModel = Backbone.Model.extend({
    mode: 'connections'
  }),

  AppView = Backbone.View.extend({
    el: document.getElementById('main'),

    initialize: function() {
      _.bindAll(this, 'handleFaceResult', 'processProfiles', 'fetchAttributes', 'switchView');
      this.topTitleModel = new TopTitleModel();
      this.topTitleListView = new TopTitleListView({
        el: this.$('.topTitles'),
        model: this.topTitleModel
      });
      this.model = new AppModel();

      this.cxnListElem = this.$('.cxnWrapper');
      this.$('.filterDropdown').attr('value', 'all-filter');
      this.model.bind('change', this.switchView);
    },

    render: function() {
      this.cxnList.each(function(cxn) {
        cxn.render();
      });
    },

    switchView: function() {
      var wrapper = this.$('.wrapper'),
          mode = this.model.get('mode'),
          cxnWrapper = wrapper.children('.cxnWrapper'),
          topTitles = wrapper.children('.topTitles');

      if (!this.topTitleModel.get('initialized')) {
        $.get('/facetoptitles', this.topTitleListView.handleTopTitleData);
      }

      if (mode === 'connections') {
        topTitles.hide();
        cxnWrapper.show();
      }
      else {
        cxnWrapper.hide();
        topTitles.show();
      }
    },

    addCxns: function(cxns) {
      this.cxnList = new ConnectionList(cxns); // collection of cxns
      this.cxnListView = new ConnectionListView({ el: this.$('.cxnWrapper'), collection: this.cxnList });
    },

    handleFaceResult: function(urls, response) {
      var i, len, photos, photo, cxn, attrs, allCachedAttrs = [], data = {};
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
          attrs = photo.tags[0].attributes;
          cxn.set({ 'photoAttributes': attrs });
          // push url and attributes to store into redis using mset
          allCachedAttrs.push(photo.url);
          allCachedAttrs.push(JSON.stringify(attrs));
        }
        if (cxn.get('pictureUrl') !== photo.url) { alert('urls don\'t match; something is wrong'); }
      }
      if (allCachedAttrs.length) {
        data.attrs = allCachedAttrs;
        $.post('/facecache-set', data);
      }
    },

    doFilter: function() {
      var filterVal = this.$('.filterDropdown').attr('value');
      this.$('.cxns').removeClass().addClass('cxns').addClass(filterVal);
    },

    doSwitchMode: function() {
      this.model.set({ mode: 'topTitles' });
    },

    // @cachedAttrs: is an array of JSON.stringify'ed photo attribute
    // objects.
    processProfiles: function(cachedAttrs) {
      var i = 0,
          picUrlList = [],
          MAX_DETECT = 30, // Face API limits to 30 urls
          url, newPic, len, attributes;

      for (len = cachedAttrs.length; i<len; ++i) {
        if (cachedAttrs[i] !== null) {
          attributes = JSON.parse(cachedAttrs[i]);
          cxn = this.cxnList.detect(function(cxn) {
            return cxn.get('pictureUrl') === attributes.url;
          });
          cxn.set({ 'photoAttributes': attributes });
        }
      }
    },

    fetchAttributes: function(profiles) {
      var i, len, cxn, data = {}, _this = this;

      // Remove all profiles without pictures
      for (i=0, len = profiles.length; i<len; ++i) {
        cxn = profiles[i];
        if (typeof cxn.pictureUrl !== 'string' || cxn.pictureUrl === 'private') {
          // NONEXISTENT OR PRIVATE PICTURE
          profiles.splice(i, 1);
          --len;
          --i;
        }
      }

      this.addCxns(profiles);
      if (profiles.length) {
        data.profiles = profiles;
        $.post('/facecache-get', data, function(data) {
          _this.processProfiles(data.attrs);
        });
      }
      else {
        console.log('no urls. what?');
      }
    },

    getJobTitleStats: function() {
    },

    events: {
      'change .filterDropdown': "doFilter",
      'click .switchMode': "doSwitchMode"
    }
  }),

  callFaceDetect = function(urls) {
    faceClient.faces_detect(urls, appView.handleFaceResult);
  },

  handleConnectionsResult = function(result) {
    if (!result || !result.values || result.values.length === 0 ) { console.log('no connections?'); return; }
    connections = result.values;
    if (ownProfile) {
      connections.unshift(ownProfile);
      appView.fetchAttributes(connections);
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
    ownProfile = result.values[0];
    if (connections) {
      connections.unshift(ownProfile);
      appView.fetchAttributes(connections);
    }
  },

  onLinkedInAuth = function() {
    var fields = ['firstName','lastName','id','pictureUrl','three-current-positions:(title)','site-standard-profile-request:(url)'];
    IN.API.Profile("me")
          .fields(fields)
          .result(handleOwnProfile);
    IN.API.Connections("me")
          .fields(fields)
          .result(handleConnectionsResult);
    $('.wrapper').show();
    $('.intro').hide();
  };

  onLinkedInLoad = function() {
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };

  appView = new AppView();
});
