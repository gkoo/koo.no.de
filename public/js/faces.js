// TODO: cache results on server
// TODO: detect when one of the filters has no results

var onLinkedInLoad;
google.load("visualization", "1", {packages:["corechart"]});
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
          //chartData = new google.visualization.DataTable(),
          i, j, len, titleLen, chartData, chart, chartDiv;
          //i, j, len, ul, li, attr, values, titleLen;

      /*
      chartData.addColumn('string', 'Title');
      chartData.addColumn('number', 'Count');
      chartData.addRows(titles.length/2); // array of both titles and counts, so divide by 2
      for (i=0, len=titles.length; i<len; i+=2) {
        chartData.setValue(i/2, 0, titles[i+1]);
        chartData.setValue(i/2, 1, parseInt(titles[i], 10));
      }
      chart = new google.visualization.BarChart(document.getElementById('chart_div'));
      chart.draw(chartData, {width: 400, height: 240, title: attr.name,
                        vAxis: {title: 'Title', titleTextStyle: {color: 'red'}}
                       });
      */
      for (i=0, len = topTitles.length; i<len; ++i) {
        // for each attribute (e.g. 'smiling', 'glasses', 'angry')
        attr      = topTitles[i];
        titles    = attr.value;
        chartData = new google.visualization.DataTable();

        chartData.addColumn('string', 'Title');
        chartData.addColumn('number', 'Count');
        chartData.addRows(titles.length/2); // array of both titles and counts, so divide by 2
        console.log('titles are: ' + titles);
        for (j=0, titleLen=titles.length; j<titleLen; j+=2) {
          // for each job title in the attribute bucket.
          console.log('chartData.setValue(' + j/2 + ', 0, "' + titles[j+1] + '");');
          console.log('chartData.setValue(' + j/2 + ', 1, "' + parseInt(titles[j], 10) + '");');
          chartData.setValue(j/2, 0, titles[j+1]);
          chartData.setValue(j/2, 1, parseInt(titles[j], 10));
        }
        //chartDiv = $('<div>').attr('id', attr.name + '-chart');
        //dataElem.append(chartDiv);
        chart = new google.visualization.BarChart(document.getElementById(attr.name + '-chart'));
        chart.draw(chartData, {width: 400, height: 240, title: attr.name,
                          vAxis: {title: 'Title', titleTextStyle: {color: 'red'}}
                         });
      }
      this.model.set({ initialized: true });
    }
  }),

  AppModel = Backbone.Model.extend({
    initialize: function() {
      this.set({ mode: 'connections' });
    }
  }),

  AppView = Backbone.View.extend({
    el: document.getElementById('main'),

    initialize: function() {
      _.bindAll(this, 'processProfiles', 'fetchAttributes', 'switchView', 'handleGoogleChartAPILoaded');
      this.topTitleModel = new TopTitleModel();
      this.topTitleListView = new TopTitleListView({
        el: this.$('.topTitles'),
        model: this.topTitleModel
      });
      this.model = new AppModel();

      this.cxnListElem = this.$('.cxnWrapper');
      this.$('.filterDropdown').attr('value', 'all-filter');
      this.model.bind('change', this.switchView);

      // alert('loading corechart');
    },

    render: function() {
      this.cxnList.each(function(cxn) {
        cxn.render();
      });
    },

    handleGoogleChartAPILoaded: function() {
      alert('done loading corechart');
      this.topTitleListView.chartAPILoaded = true;
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

    doFilter: function() {
      var filterVal = this.$('.filterDropdown').attr('value');
      this.$('.cxns').removeClass().addClass('cxns').addClass(filterVal);
    },

    doSwitchMode: function() {
      var mode = this.model.get('mode'),
          newMode;
      newMode = mode === 'connections' ? 'topTitles' : 'connections';
      this.model.set({ mode: newMode });
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
