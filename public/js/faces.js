// TODO: detect when one of the filters has no results
// TODO: refine logged out experience

var onLinkedInLoad;
google.load("visualization", "1", {packages:["corechart"]});
$(function() {
  var NO              = 'no',
      YES             = 'yes',
      authed          = 0,
      introElem       = $('.intro'),
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
      el.empty()
        .append(nameElem);
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
      if (typeof secondaryClass === 'undefined') {
        secondaryClass = '';
      }
      this.attrInfo.append($('<li>').addClass([secondaryClass, 'shadow'].join(' '))
                                    .append($('<img>').addClass([type, secondaryClass].join(' '))
                                                      .attr({ alt: type,
                                                              src: ['/img/emoticons/', type, '.png'].join('') })));
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
      _.bindAll(this, 'handleTopTitleData', 'doChartFilter');
      this.filterElem = this.$('.chartFilterDropdown');
      this.chartWrapperElem = this.$('.chartWrapper');
    },
    handleTopTitleData: function(data) {
      var topTitles = data.topTitles, // array of objects
          dataElem = this.$('.data'),
          dataElemWidth = $('body').width(),
          i, j, len, titleLen, chartData, chart, chartDiv, chartName;

      for (i=0, len = topTitles.length; i<len; ++i) {
        // for each attribute (e.g. 'smiling', 'glasses', 'angry')
        attr      = topTitles[i];
        titles    = attr.value;
        chartName = attr.name,

        chartData = new google.visualization.DataTable();
        chartData.addColumn('string', 'Title');
        chartData.addColumn('number');
        chartData.addRows(titles.length/2); // array of both titles and counts, so divide by 2

        for (j=0, titleLen=titles.length; j<titleLen; j+=2) {
          // for each job title in the attribute bucket, add data.
          chartData.setValue(j/2, 0, titles[j+1]);
          chartData.setValue(j/2, 1, parseInt(titles[j], 10));
        }

        if (chartName === 'smiling') {
          chartName = 'The Smilingest Job Titles';
        }
        else if (chartName === 'nosmiling') {
          chartName = 'The No-Smilingest Job Titles';
        }
        else if (chartName === 'glasses') {
          chartName = 'The Most Glasses-Wearing Job Titles';
        }
        else if (chartName === 'noglasses') {
          chartName = 'The Least Glasses-Wearing Job Titles';
        }
        else if (chartName === 'happy') {
          chartName = 'The Happiest Job Titles';
        }
        else if (chartName === 'neutral') {
          chartName = 'The Neutralest Job Titles';
        }
        else if (chartName === 'sad') {
          chartName = 'The Saddest Job Titles';
        }
        else if (chartName === 'angry') {
          chartName = 'The Angriest Job Titles';
        }
        else if (chartName === 'surprised') {
          chartName = 'The Most Surprised Job Titles';
        }
        else if (chartName === 'noattrs') {
          chartName = 'The Most Undetectable Job Titles';
        }
        chart = new google.visualization.BarChart(this.$('.' + attr.name + '-chart').get(0));
        // chart style
        chart.draw(chartData, { backgroundColor: 'none',
                                chartArea: {
                                  left: '33%',
                                  top: 100,
                                  width: '40%',
                                  height: '50%'
                                },
                                enableInteractivity: false,
                                hAxis: {
                                  gridlineColor: '#666',
                                  textStyle: {
                                    color: '#fff'
                                  }
                                },
                                legend: 'none',
                                title: chartName,
                                titleTextStyle: {
                                  color: '#fff'
                                },
                                vAxis: {
                                  textStyle: {
                                    color: '#fff'
                                  }
                                },
                                width: dataElemWidth,
                                height: 768
                              });
      }
      this.model.set({ initialized: true });
    },
    doChartFilter: function() {
      var val = this.filterElem.attr('value');
      this.chartWrapperElem.removeClass()
                           .addClass('chartWrapper')
                           .addClass(val);
    },
    events: {
      'change .chartFilterDropdown': "doChartFilter"
    }
  }),

  AppModel = Backbone.Model.extend({
    initialize: function() {
      this.set({ mode: 'intro' });
    }
  }),

  AppRouter = Backbone.Router.extend({
    initialize: function(o) {
      this.route('', 'intro', o.viewIntro);
      this.route('connections', 'connections', o.viewConnections);
      this.route('jobTitle', 'jobTitle', o.viewJobTitle);
    }
  }),

  AppView = Backbone.View.extend({
    el: document.getElementById('main'),

    initialize: function() {
      _.bindAll(this,
                'processProfiles',
                'fetchAttributes',
                'viewIntro',
                'viewConnections',
                'viewJobTitle',
                'handleConnectionsResult',
                'handleOwnProfile');

      this.topTitleModel = new TopTitleModel();
      this.topTitleListView = new TopTitleListView({
        el: this.$('.topTitles'),
        model: this.topTitleModel
      });
      this.router = new AppRouter({ viewIntro:       this.viewIntro,
                                    viewConnections: this.viewConnections,
                                    viewJobTitle:    this.viewJobTitle });
      this.model = new AppModel();

      this.bodyElem       = $('body');
      this.cxnListElem    = this.$('.cxnWrapper');
      this.topTitlesElem  = this.$('.topTitles');
      this.titleElem      = this.$('.title');

      this.$('.filterDropdown').attr('value', 'all-filter');

      Backbone.history.start();
    },

    render: function() {
      this.cxnList.each(function(cxn) {
        cxn.render();
      });
    },

    viewIntro: function() {
      console.log('viewIntro');
      this.cxnListElem.hide();
      this.topTitlesElem.hide();
      this.$('.intro').show();
    },

    viewConnections: function() {
      if (!authed) {
        console.log('not authed');
        this.router.navigate('intro', true);
        this.intendedRoute = 'connections';
        return;
      }
      this.cxnListElem.fadeIn('slow');
      this.topTitlesElem.fadeOut('slow');
      this.bodyElem.removeClass('jobTitles');
      this.bodyElem.addClass('connections');
      this.titleElem.text('Faces of LinkedIn');
      this.model.set({ mode: 'connections' });
    },

    viewJobTitle: function() {
      if (!authed) {
        this.router.navigate('intro', true);
        this.intendedRoute = 'jobTitle';
        return;
      }
      if (!this.topTitleModel.get('initialized')) {
        $.get('/facetoptitles', this.topTitleListView.handleTopTitleData);
      }

      this.cxnListElem.fadeOut('slow');
      this.topTitlesElem.fadeIn('slow');
      this.model.set({ mode: 'topTitles' });

      this.bodyElem.addClass('jobTitles');
      this.bodyElem.removeClass('connections');
      this.titleElem.text('Facial Features by Job Title');
      this.topTitleListView.doChartFilter();

      this.model.set({ mode: 'jobTitles' });
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
      newMode = mode === 'connections' ? 'jobTitles' : 'connections';
      this.router.navigate(newMode);
    },

    handleConnectionsResult: function(result) {
      if (!result || !result.values || result.values.length === 0 ) { console.log('no connections?'); return; }
      connections = result.values;
      if (ownProfile) {
        connections.unshift(ownProfile);
        this.fetchAttributes(connections);
      }
      else {
        connections = result.values;
      }
    },

    handleOwnProfile: function(result) {
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
        this.fetchAttributes(connections);
      }
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
      this.$('#wrapper').show();
      if (profiles.length) {
        data.profiles = profiles;
        $.post('/facecache-get', data, function(data) {
          _this.processProfiles(data.attrs);
        });
      }
      else {
        console.log('no urls. what?');
      }

      if (this.model.get('mode') === 'intro') {
        if (this.intendedRoute) {
          this.router.navigate(this.intendedRoute, true);
        }
        else {
          this.router.navigate('connections', true);
        }
      }
    },

    initApp: function() {
      var fields = ['firstName','lastName','id','pictureUrl','three-current-positions:(title)','site-standard-profile-request:(url)'];
      introElem.fadeOut();
      IN.API.Profile("me")
            .fields(fields)
            .result(this.handleOwnProfile);
      IN.API.Connections("me")
            .fields(fields)
            .result(this.handleConnectionsResult);
    },

    events: {
      'change .filterDropdown': "doFilter",
      'click .switchMode': "doSwitchMode"
    }
  }),

  appView = new AppView(),

  onLinkedInAuth = function() {
    appView.initApp();
    authed = 1;
  };

  onLinkedInLoad = function() {
    introElem.fadeIn('fast');
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };
});
