$(function() {
  var homeBtn = $('#homeBtn'),
      ANIMATION_DELAY = 500,

  DrawerView = Backbone.View.extend({
    el: $('#drawerWrapper'),

    initialize: function() {
      _.bindAll(this, 'hide', 'show');
      this.drawerEl = $('#drawer');
      this.visible = false;
      $('#homeBtn').toggle(this.hide, this.show);
    },

    show: function() {
      var _this = this;
      this.el.removeClass('hidden');
      setTimeout(function() {
        _this.drawerEl.removeClass('hide');
        _this.visible = true;
      }, 10);
    },

    hide: function() {
      var _this = this;
      this.drawerEl.addClass('hide');
      setTimeout(function() {
        _this.el.addClass('hidden');
        _this.visible = false;
      }, 500);
    }

  }),

  ContentView = Backbone.View.extend({
    el: $('#content'),

    initialize: function() {
      this.visible = false;
      _.bindAll(this, 'showSection', 'hide');
    },

    hide: function() {
      this.el.removeClass('show');
      this.visible = false;
    },

    showSection: function(section) {
      var sectionEl = $('#' + section);
      sectionEl.show()
               .siblings().hide();

      // slide content down
      this.el.addClass('show');
      this.visible = true;
    },
  }),

  SiteRouter = Backbone.Router.extend({
    initialize: function() {
      _.extend(this, Backbone.Events);
      _.bindAll(this, 'resume', 'blog', 'about');
    },

    routes: {
      "blog":   "blog",
      "resume": "resume",
      "about":  "about",
      "":       "home"
    },

    resume: function() {
      this.trigger('resume');
    },

    blog: function() {
      this.trigger('blog');
    },

    about: function() {
      this.trigger('about');
    },

    home: function() {
      this.trigger('home');
    }
  }),

  SiteController = function() {
    var controller = {
      initialize: function() {
        _.bindAll(this,
                  'bindRoutes',
                  'showAbout',
                  'showResume',
                  'showBlog',
                  'showHome',
                  'showContent');
        this.router = new SiteRouter();
        this.contentView = new ContentView();
        this.drawerView = new DrawerView();
        this.bindRoutes();
        return this;
      },

      bindRoutes: function() {
        this.router.bind('about', this.showAbout);
        this.router.bind('resume', this.showResume);
        this.router.bind('blog', this.showBlog);
        this.router.bind('home', this.showHome);
      },

      showContent: function(section) {
        var _this = this;

        // check if drawer is visible first before
        // animating it away. this is to prevent a
        // jarring animation when the user navigates
        // to the content section URL directly.
        if (this.drawerView.visible) {
          this.drawerView.hide();
          setTimeout(function() {
            _this.contentView.showSection(section);
          }, ANIMATION_DELAY);
        }
        else {
          this.contentView.showSection(section);
        }
      },

      showAbout: function() {
        this.showContent('about');
      },

      showResume: function() {
        this.showContent('resume');
      },

      showBlog: function() {
        this.showContent('blog');
      },

      showHome: function() {
        var _this = this;
        if (this.contentView.visible) {
          this.contentView.hide();
          setTimeout(function() {
            _this.drawerView.show();
          }, ANIMATION_DELAY);
        }
        else {
          this.drawerView.show();
        }
      }
    };
    return controller.initialize();
  },

  doDrawerShow = function() {
    drawerEl.addClass('hide');
    setTimeout(function() {
      drawerEl.addClass('hidden');
    }, 500);
  },

  doDrawerHide = function() {
    drawerEl.removeClass('hidden')
            .removeClass('hide');
  },

  //setupHomeBtn = function() {
    //homeBtn.toggle(function(evt) {
      //// Showing ...
      //evt.preventDefault();
      //doDrawerShow();
    //}, function(evt) {
      //// Hiding ...
      //evt.preventDefault();
      //doDrawerHide();
    //});
  //},

  init = function() {
    var controller = new SiteController();
    //setupHomeBtn();
    Backbone.history.start({ pushState: true });
  };

  init();
});
