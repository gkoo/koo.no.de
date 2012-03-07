// ====
// BLOG
// ====

var addClass = function (el, newClass) {
  if (el.className.indexOf(newClass) < 0) {
    if (el.className.length > 0) {
      el.className += ' ';
    }
    el.className += newClass;
  }
},

removeClass = function (el, classToRemove) {
  var classes = el.className.split(' '),
      i, len;
  for (i = 0, len = classes.length; i < len; ++i) {
    if (classes[i] === classToRemove) {
      classes.splice(i, 1);
      break;
    }
  }
  el.className = classes.join(' ');
},

hasClass = function (el, className) {
  return (el.className.indexOf(className) != -1);
},

BlogPostCollection = Backbone.Collection.extend({
  initialize: function () {
    var siteId = 6512834;
    this.fetchPosts = this.fetchPosts.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.url = 'http://www.posterous.com/api/2/sites/' + siteId + '/posts/public?callback=posterousCallback';
    window.posterousCallback = this.handleResponse;
  },

  fetchPosts: function () {
    var newScriptEl;
    if (this.length) {
      // we've already fetched the posts.
      return;
    }

    newScriptEl = document.createElement('script');
    newScriptEl.src = this.url;
    document.body.appendChild(newScriptEl);
  },

  handleResponse: function (o) {
    this.reset(o);
  }
}),

BlogView = Backbone.View.extend({
  el: document.querySelector('.section.blog'),

  initialize: function() {
    this.render = this.render.bind(this);
    this.createPostTemplate = this.createPostTemplate.bind(this);
    this.createPostTemplate();
    this.spinnerEl = document.querySelector('.section.blog .spinner');
    this.blogContentEl = document.querySelector('.section.blog .blogContent');
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
    this.spinnerEl.style.display = 'none';
    this.blogContentEl.innerHTML = postsHtml;
  }
}),

Blog = function(preloaded) {
  this.init = function(preloaded) {
    this.preloaded = preloaded;
    // Don't do any set-up if blog post was fetched server-side.
    if (!this.preloaded) {
      this.view = new BlogView();
      this.postCollection = new BlogPostCollection();
      this.postCollection.on('reset', this.view.render);
      this.fetchPosts = this.postCollection.fetchPosts;
      return this;
    }
  };

  return this.init(preloaded);
},

// ========
// HOMEPAGE
// ========

ContentView = Backbone.View.extend({
  el: document.getElementById('content'),

  initialize: function() {
    var homeBtn;
    _.extend(this, Backbone.Events);
    this.showSection = this.showSection.bind(this);
    this.hide = this.hide.bind(this);
    this.goHome = this.goHome.bind(this);
    this.id = this.el.getAttribute('id');

    homeBtn = document.querySelector('.homeBtn');
    homeBtn.addEventListener('click', this.goHome);
  },

  showSection: function(section) {
    var sectionEl = document.querySelector('#' + this.id + ' .' + section);
    this.el.style.display = 'block';
    addClass(sectionEl, 'show');
  },

  hide: function() {
    var showingSection = document.querySelector('.section.show'),
        i, len;
    if (showingSection) {
      removeClass(showingSection, 'show');
    }
    removeClass(this.el, 'show');
    this.el.style.display = 'none';
  },

  goHome: function(evt) {
    evt.preventDefault();
    this.trigger('goHome');
  }
}),

NavView = Backbone.View.extend({
  el: document.getElementById('sectionBtnWrapper'),

  initialize: function() {
    var el = this.el;
    _.extend(Backbone.Events);

    this.goToSection = this.goToSection.bind(this);
    this.hide = this.hide.bind(this);
    this.show = this.show.bind(this);

    this.id = el.getAttribute('id');
    this.el.addEventListener('click', this.goToSection);

    // Prevent CSS3 transitions until page is loaded. Sort of hacky.
    setTimeout(function() {
      addClass(el, 'loaded');
    }, 100);
  },

  goToSection: function(evt) {
    var target = evt.target,
        parent;
    if (!hasClass(target, 'title')) {
      parent = target.parentElement;
      if (hasClass(parent, 'title')) {
        target = parent;
      }
    }
    evt.preventDefault();
    page = target.getAttribute('data-section');
    this.trigger('section:navigate', page);
  },

  show: function () {
    removeClass(this.el, 'faded');
    this.fadingTimeout = window.setTimeout((function() {
      removeClass(this.el, 'fading');
    }).bind(this), 10);
  },

  hide: function (anim_duration) {
    addClass(this.el, 'fading');
    this.fadingTimeout = window.setTimeout((function() {
      addClass(this.el, 'faded');
    }).bind(this), anim_duration);
  }
}),

HomepageRouter = Backbone.Router.extend({
  initialize: function() {
    _.extend(Backbone.Events);
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
  this.sectionBtnWrapper = document.getElementById('sectionBtnWrapper');

  this.changeSection = (function(section) {
    var ANIM_DURATION = 400;
    if (section) {
      if (section === 'blog' && !this.blog.preloaded) {
        this.blog.fetchPosts();
      }
      this.navView.hide(ANIM_DURATION);
      setTimeout((function() {
        this.contentView.showSection(section);
      }).bind(this), ANIM_DURATION);
    }
    else {
      // show nav view
      this.contentView.hide();
      this.navView.show();
    }

    this.router.navigate(section);
  }).bind(this);

  this.setupEvents = function() {
    this.navView.on('section:navigate', this.changeSection);
    this.contentView.on('goHome', this.changeSection);
    this.router.on('route', this.changeSection);
  };

  this.init = function() {
    this.router = new HomepageRouter();
    // only show navView if user didn't navigate directly to a section
    this.navView = new NavView();
    this.contentView = new ContentView();
    this.blog = new Blog(initialPage === 'blog');
    this.setupEvents();

    Backbone.history.start({ pushState: true });
  };

  this.init();
};

// Define bind for Safari
if (typeof Function.bind === 'undefined') {
  Function.prototype.bind = function (bind) {
    var self = this;
    return function () {
      var args = Array.prototype.slice.call(arguments);
      return self.apply(bind || null, args);
    };
  };
}

document.body.onload = function () {
  var homepage = new Homepage(currPage);
};
