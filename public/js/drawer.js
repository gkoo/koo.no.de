var ANIMATION_DELAY = 400,

DrawerView = Backbone.View.extend({
  el: $('#drawerWrapper'),

  initialize: function() {
    _.bindAll(this, 'hide', 'show');
    this.drawerEl = $('#drawer');
    this.visible = false;
  },

  show: function() {
    var _this = this;
    this.el.removeClass('hidden');
    setTimeout(function() {
      _this.drawerEl.removeClass('hide');
      _this.visible = true;
    }, ANIMATION_DELAY);
  },

  hide: function() {
    var _this = this;
    this.drawerEl.addClass('hide');
    setTimeout(function() {
      _this.el.addClass('hidden');
      _this.visible = false;
    }, ANIMATION_DELAY);
  }
}),

BlogView = Backbone.View.extend({
  el: $('#blogSection'),

  initialize: function() {
    _.bindAll(this, 'render');
    this.generateBlogTemplate();
  },

  generateBlogTemplate: function() {
    var template, postTemplate;

    postTemplate = '<li class="blogPost">' +
                   '<h3 class="blogPostTitle"><a href="/blog/title/<%= post.slug %>">' +
                   '<%= post.title %>' +
                   '</a></h3>' +
                   '<p class="datetime"><%= post.timestamp %></p>' +
    //             '<a class="share" title="Share this post">Share</a>'; +
                   '<div class="post-wrapper"><%= post.post %></div>' +
                   '</li>';

    template = '<ul><% _.each(posts, function(post) { %>' +
               postTemplate +
               '<% }); %></ul>';

    this.blogTemplate = template;
  },

  render: function(data) {
    this.blogPosts = data;
    if (typeof data !== 'undefined') {
      this.el.children('.blogContent').html(_.template(this.blogTemplate, data));
    }
    else {
      console.log('[ERR] blog data is undefined');
    }
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

  showSection: function(section, animate) {
    var sectionEl = $('#' + section + 'Section'),
        el = this.el;

    if (typeof animate === 'undefined') {
      // default animate true
      animate = false;
    }

    sectionEl.show()
             .siblings().hide();

    // slide content down
    if (!animate) {
      el.addClass('show');
    }
    else {
      el.addClass('show');
    }

    this.visible = true;
  }
}),

HomeBtnView = Backbone.View.extend({
  el: $('#homeBtn'),

  initialize: function() {
    _.extend(this, Backbone.Events);
    _.bindAll(this, 'goHome', 'show', 'hide');
  },

  events: {
    'click': 'goHome'
  },

  goHome: function() {
    this.trigger('goHome');
  },

  show: function(animate) {
    var el = this.el;

    if (animate) {
      el.addClass('show');
    }
    else {
      el.addClass('noanim');
      el.addClass('show');
      setTimeout(function() {
        el.removeClass('noanim');
      }, 10);
    }
  },

  hide: function() {
    this.el.removeClass('show');
  }
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
    "home":   "home",
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
      this.homeBtnView = new HomeBtnView();
      this.blogView = new BlogView();
      this.bindRoutes();
      return this;
    },

    bindRoutes: function() {
      this.router.bind('about', this.showAbout);
      this.router.bind('resume', this.showResume);
      this.router.bind('blog', this.showBlog);
      this.router.bind('home', this.showHome);
      this.homeBtnView.bind('goHome', this.showHome);
    },

    showContent: function(section) {
      var _this = this,
          drawerVisible = this.drawerView.visible;

      // check if drawer is visible first before
      // animating it away. this is to prevent a
      // jarring animation when the user navigates
      // to the content section URL directly.
      if (drawerVisible) {
        this.drawerView.hide();
        setTimeout(function() {
          _this.contentView.showSection(section, drawerVisible);
          _this.homeBtnView.show(true);
        }, ANIMATION_DELAY);
      }
      else {
        // drawer isn't visible. don't animate.
        this.contentView.showSection(section);
        this.homeBtnView.show(false);
      }
    },

    showAbout: function() {
      this.showContent('about');
    },

    showResume: function() {
      this.showContent('resume');
    },

    showBlog: function() {
      var blogView = this.blogView;
      // Only load blog view on the first time.
      if (!blogView.blogPosts) {
        $.get('/blogAjax', function(data) {
          blogView.render(data);
        });
      }
      this.showContent('blog');
    },

    showHome: function() {
      var _this = this;
      if (this.contentView.visible) {
        this.contentView.hide();
        this.homeBtnView.hide();
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

init = function() {
  var controller = new SiteController();
  Backbone.history.start({ pushState: true });
};

$(function() {
  init();
});
