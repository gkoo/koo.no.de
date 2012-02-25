// ====
// BLOG
// ====

var BlogPostCollection = Backbone.Collection.extend({
  initialize: function() {
    var siteId = 6512834;
    _.bindAll(this, 'fetchPosts');
    this.url = 'http://www.posterous.com/api/2/sites/' + siteId + '/posts/public';
  },

  fetchPosts: function() {
    var _this = this;
    if (this.length) {
      // we've already fetched the posts.
      return;
    }
    this.fetch({
      dataType: 'jsonp',
      data: { page: 1 },
      success: function(collection, response) {
        console.log('blog fetch success');
      },
      error: function(collection, response) {
        console.log('blog fetch error');
        console.log(response);
      }
    });
  }
}),

BlogView = Backbone.View.extend({
  el: $('.section.blog'),

  initialize: function() {
    _.bindAll(this, 'render',
                    'createPostTemplate');
    this.createPostTemplate();
  },

  createPostTemplate: function() {
    var templateStr = ['<li class="blog-post">',
                       '  <h3 class="title post-title">',
                       '    <a href="<%= full_url %>"><%= title %></a>',
                       '  </h3>',
                       '  <span class="post-date"><%= display_date %></span>',
                       '  <%= body_html %>',
                       '</li>'].join('');
    this.postTemplate = _.template(templateStr);
  },

  render: function(collection) {
    var postsHtml = '',
        _this = this;
    collection.each(function(post) {
      postsHtml += _this.postTemplate(post.toJSON());
    });
    this.$el.find('.spinner').remove();
    this.$el.find('.blogContent').html(postsHtml);
  }
}),

Blog = function() {
  this.init = function() {
    this.view = new BlogView();
    this.postCollection = new BlogPostCollection();
    this.postCollection.on('reset', this.view.render);
    this.fetchPosts = this.postCollection.fetchPosts;
    return this;
  };

  return this.init();
},

// ========
// HOMEPAGE
// ========

ContentView = Backbone.View.extend({
  initialize: function(o) {
    _.extend(this, Backbone.Events);
    _.bindAll(this, 'showSection',
                    'hide',
                    'goHome');
    this.el = o.el;
  },
  events: {
    'click .homeBtn': 'goHome'
  },
  showSection: function(section) {
    this.$el.show()
            .find('.' + section).addClass('show');
  },
  hide: function() {
    this.$el.hide()
            .find('.show').removeClass('show');
  },
  goHome: function(evt) {
    evt.preventDefault();
    this.trigger('goHome');
  }
}),

NavView = Backbone.View.extend({
  initialize: function(o) {
    _.bindAll(this, 'goToSection');
    _.extend(Backbone.Events);
    this.el = o.el;
    $(this.el).addClass('loaded');
  },

  events: {
    'click .title': 'goToSection'
  },

  goToSection: function(evt) {
    var $target = $(evt.target),
        $parent;
    if (!$target.hasClass('title')) {
      $parent = $target.parent();
      if ($parent.hasClass('title')) {
        $target = $parent;
      }
    }
    evt.preventDefault();
    page = $target.attr('data-section');
    this.trigger('section:navigate', page);
  }
}),

HomepageRouter = Backbone.Router.extend({
  initialize: function() {
    _.extend(Backbone.Events);
    _.bindAll(this, 'home', 'blog');
  },
  routes: {
    '': 'home',
    home: 'home',
    about: 'about',
    blog: 'blog',
    projects: 'projects',
    misc: 'misc'
  },
  home: function() {
    this.trigger('route', '');
  },
  about: function() {
    this.trigger('route', 'about');
  },
  blog: function() {
    this.trigger('route', 'blog');
  },
  projects: function() {
    this.trigger('route', 'projects');
  },
  misc: function() {
    this.trigger('route', 'misc');
  }
}),

Homepage = function(initialPage) {
  var _this = this,
      ANIM_DURATION = 400,
      contentEl = $('#content');

  this.sectionBtnWrapper = $('#sectionBtnWrapper');

  this.hideSectionBtns = function() {
    this.sectionBtnWrapper.addClass('fading');
    this.fadingTimeout = window.setTimeout(function() {
      _this.sectionBtnWrapper.addClass('faded');
    }, ANIM_DURATION);
  };

  this.showSectionBtns = function() {
    contentEl.removeClass('show')
             .children('.show').removeClass('show');
    this.sectionBtnWrapper.removeClass('faded');
    console.log('setting fading timeout');
    this.fadingTimeout = window.setTimeout(function() {
      _this.sectionBtnWrapper.removeClass('fading');
    }, 10);
  };

  this.changeSection = function(section) {
    window.clearTimeout(this.fadingTimeout);

    if (section) {
      if (section === 'blog') {
        this.blog.fetchPosts();
      }
      this.hideSectionBtns();
      setTimeout(function() {
        _this.contentView.showSection(section);
      }, ANIM_DURATION);
    }
    else {
      if (this.fadingTimeout) {
        console.log('clearing fading timeout');
      }
      this.contentView.hide();
      this.showSectionBtns();
    }

    this.router.navigate(section);
  };

  this.setupEvents = function() {
    this.navView.on('section:navigate', this.changeSection);
    this.contentView.on('goHome', this.changeSection);
    this.router.on('route', this.changeSection);
  };

  this.init = function() {
    //var blog = new Blog();
    _.bindAll(this);
    this.router = new HomepageRouter();
    // only show navView if user didn't navigate directly to a section
    this.navView = new NavView({ el: $('#sectionBtnWrapper') });
    this.contentView = new ContentView({ el: $('#content') });
    this.blog = new Blog();
    this.setupEvents();

    Backbone.history.start({ pushState: true });
  };

  this.init();
};

$(function() {
  var homepage = new Homepage(currPage);
});
