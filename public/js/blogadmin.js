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
        $.getJSON('/blog/id/' + id, function(data) {
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
        _this.$('.formattingHelp').css('top', '-100px');
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
      _.bindAll(this, 'deletePost');
      _.extend(this, Backbone.Events);
    },

    events: {
      'click .delete-link': 'deletePost'
    },

    deletePost: function(evt) {
      var li = $(evt.target).parent(),
          id, rev;

      id  = li.find('.post-id').val();
      rev = li.find('.post-rev').val();
      this.trigger('delete', { 'id': id,
                               'rev': rev });
      evt.preventDefault();
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
        _.bindAll(this, 'handlePublish', 'handlePw', 'handleRoute', 'handleEditPost', 'handleDeletePost');

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
        this.postsView.bind('delete', this.handleDeletePost);
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
        this.editModel.set({ 'currentPostId' : data._id });
        this.editModel.set({ 'currentPostRev' : data._rev });
      },

      handleDeletePost: function(o) {
        var sure;
        if (!this.pw) {
          this.router.navigate('auth', true);
          return;
        }
        sure = confirm('Are you sure you want to delete this post?');
        if (!sure) { return; }

        o.pw = this.pw;

        // o should contain id and rev.
        $.post('/blog-delete-post', o, function(data, textStatus) {
          console.log(data);
        });
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
                 isDraft: o.isDraft,
                 id: this.editModel.get('currentPostId'),
                 rev: this.editModel.get('currentPostRev') };

        console.log('a');
        console.log(this.editModel.get('currentPostId'));
        console.log('b');
        $.post('/blog-publish',
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
