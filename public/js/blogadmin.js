var debug = 0;
$(function() {
  var BlogAdminRouter = Backbone.Router.extend({
    initialize: function(o) {
      _.extend(this, Backbone.Events);
      _.bindAll(this,
                'showAuth',
                'showEdit',
                'showPosts');
      this.authView = o.authView;
      this.editView = o.editView;
      this.postsView = o.postsView;

      this.route('', 'index', this.showAuth);
      this.route('auth', 'auth', this.showAuth);
      this.route('edit', 'edit', this.showEdit);
      this.route('posts', 'posts', this.showPosts);
    },

    showAuth: function() {
      this.authView.show();
      this.editView.hide();
      this.postsView.hide();
      this.trigger('route', 'auth');
    },

    showEdit: function() {
      this.authView.hide();
      this.editView.show();
      this.postsView.hide();
      this.trigger('route', 'edit');
    },

    showPosts: function() {
      this.authView.hide();
      this.editView.hide();
      this.postsView.show();
      this.trigger('route', 'posts');
    },
  }),

  BlogAuthView = Backbone.View.extend({
    el: $('.auth'),

    initialize: function() {
      _.extend(this, Backbone.Events);
      _.bindAll(this,
                'handlePwSubmit',
                'show',
                'hide');
    },

    events: {
      'submit #blogAuthForm': 'handlePwSubmit'
    },

    handlePwSubmit: function(evt) {
      var pw = this.$('#blogAuthForm').children('#pw').attr('value');
      this.trigger('pwsubmit', pw);
      evt.preventDefault();
    },

    show: function() {
      this.el.show();
    },

    hide: function() {
      this.el.hide();
    }
  }),

  BlogEditView = Backbone.View.extend({
    el: $('.edit'),

    initialize: function() {
      _.extend(this, Backbone.Events);

      _.bindAll(this,
                'postSuccess',
                'postHelper',
                'handlePostSubmit',
                'saveDraft',
                'show',
                'hide');

      this.setupFormattingHelp();
    },

    events: {
      'submit .createPostForm': 'handlePostSubmit',
      'click  .save':           'saveDraft'
    },

    postSuccess: function(msg) {
      if (!msg) { msg = 'Post success!'; }
      this.$('.status').text(msg);
    },

    // common helper method for posting and saving drafts
    postHelper: function(isDraft) {
      var entryVal = this.el.find('#post').attr('value'),
          entryTitle = this.el.find('#postTitle').attr('value');

      this.trigger('postsubmit', { entryVal:   entryVal,
                                   entryTitle: entryTitle,
                                   isDraft:    isDraft });
    },

    handlePostSubmit: function(evt) {
      evt.preventDefault();
      this.postHelper(false);
    },

    saveDraft: function(evt) {
      evt.preventDefault();
      this.postHelper(true);
    },

    setupFormattingHelp: function() {
      var _this = this;
      this.$('.formattingToggle').children('a').toggle(function() {
        _this.$('.formattingHelp').css('top', '0');
      }, function() {
        _this.$('.formattingHelp').css('top', '-50px');
      });
    },

    show: function() {
      this.el.show();
    },

    hide: function() {
      this.el.hide();
    }
  }),

  BlogPostsView = Backbone.View.extend({
    el: $('.post-list'),

    initialize: function() {
      this.setupClickHandlers();
    },

    setupClickHandlers: function() {
      this.$('.edit-link').click({
      })
    },

    show: function() {
      this.el.show();
    },

    hide: function() {
      this.el.hide();
    }
  }),

  BlogController = function() {
    var controller = {
      initialize: function() {
        var _this = this;
        _.bindAll(this, 'handlePost', 'handlePw', 'handleRoute');

        this.authView = new BlogAuthView();

        this.editView = new BlogEditView();

        this.postsView = new BlogPostsView();

        this.router = new BlogAdminRouter({
          'authView': this.authView,
          'editView': this.editView,
          'postsView': this.postsView
        });

        if(!this.pw) {
          this.router.navigate('auth', true);
        }

        this.setupEvents();
        Backbone.history.start();
        return this;
      },

      setupEvents: function() {
        this.editView.bind('postsubmit', this.handlePost);
        this.authView.bind('pwsubmit', this.handlePw);
        this.router.bind('route', this.handleRoute);
      },

      doAuth: function(pw, callback) {
        $.post('/blog-auth', { 'pw': pw }, function(res) {
          if (res && res.success) {
            callback(res.success);
          }
        });
      },

      handlePw: function(pw) {
        var _this = this;
        if (!pw) { alert('no password submitted'); return; }
        this.pw = pw;
        this.doAuth(this.pw, function(success) {
          if (success) {
            _this.authed = true;
            _this.router.navigate('edit', true);
          }
          else {
            alert('wrong password');
          }
        });
      },

      handleRoute: function(viewName) {
        if (viewName !== 'auth') {
          if (!this.authed && !debug) {
            this.router.navigate('auth', true);
          }
        }
      },

      handlePost: function(o) {
        var data;

        if (!this.pw) {
          this.router.navigate('auth', true);
          return;
        }

        data = { pw: this.pw,
                 title: o.entryTitle,
                 entry: o.entryVal,
                 isDraft: o.isDraft };

        $.post('/blog-post',
               data,
               function(data, textStatus) {
                 if (data && data.ok) {
                   window.location = "/blog";
                 }
                 else {
                   alert('error! check the console!');
                   console.log(data);
                 }
               }
        );
      }
    };

    return controller.initialize();
  },

  controller = new BlogController();
});
