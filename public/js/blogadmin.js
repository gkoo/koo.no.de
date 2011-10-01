var debug = 1;
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
      this.route('edit/:id', 'edit', this.showEdit);
      this.route('posts', 'posts', this.showPosts);
    },

    showAuth: function() {
      this.authView.show();
      this.editView.hide();
      this.postsView.hide();
      this.trigger('route', 'auth');
    },

    showEdit: function(id) {
      var _this = this;
      this.authView.hide();
      this.editView.show();
      this.postsView.hide();

      if (id) {
        $.getJSON('/blog/' + id, function(data) {
          _this.trigger('postInfo', data);
        });
      }

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

  BlogEditModel = Backbone.Model.extend();

  BlogEditView = Backbone.View.extend({
    el: $('.edit'),

    initialize: function() {
      _.extend(this, Backbone.Events);

      _.bindAll(this,
                'postSuccess',
                'postHelper',
                'handlePublish',
                'saveDraft',
                'show',
                'hide');

      this.setupFormattingHelp();
    },

    events: {
      'submit .createPostForm': 'handlePublish',
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

    populateFields: function(data) {
      $('#postTitle').val(data.title);
      $('#post').val(data.post);
      this.model.set({ 'currentPostId' : data._id });
    },

    handlePublish: function(evt) {
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
        _.bindAll(this, 'handlePublish', 'handlePw', 'handleRoute');

        this.authView = new BlogAuthView();

        this.editModel = new BlogEditModel();
        this.editView = new BlogEditView({ model: this.editModel });

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
        this.editView.bind('postsubmit', this.handlePublish);
        this.authView.bind('pwsubmit', this.handlePw);
        this.router.bind('route', this.handleRoute);
        this.router.bind('postInfo', this.handleEditPost);
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

      handleEditPost: function(data) {
        this.editView.populateFields(data);
      },

      handlePublish: function(o) {
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
