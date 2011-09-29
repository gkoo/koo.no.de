$(function() {
  var BlogAdminRouter = Backbone.Router.extend({
    initialize: function(o) {
      this.route('', 'index', o.viewAuth);
      this.route('auth', 'auth', o.viewAuth);
      this.route('edit', 'edit', o.viewEdit);
    }
  }),

  BlogAdminView = Backbone.View.extend({
    el: document.getElementById('content'),

    initialize: function() {
      _.extend(this, Backbone.Events);

      _.bindAll(this,
                'postSuccess',
                'postHelper',
                'handlePostSubmit',
                'handlePwSubmit',
                'saveDraft',
                'viewAuth',
                'viewEdit',
                'switchView');

      this.authElem = this.$('.auth');
      this.editElem = this.$('.edit');
      this.authForm = this.authElem.find('#blogAuthForm');

      this.setupFormattingHelp();

    },

    events: {
      'submit #blogAuthForm':   'handlePwSubmit',
      'submit .createPostForm': 'handlePostSubmit',
      'click  .save':           'saveDraft'
    },

    viewAuth: function() { this.switchView('auth'); },

    viewEdit: function() { this.switchView('edit'); },

    switchView: function(viewName) {
      if (viewName === 'auth') {
        this.authElem.show();
        this.editElem.hide();
      }
      else if (viewName === 'edit') {
        this.authElem.hide();
        this.editElem.show();
      }
    },

    postSuccess: function(msg) {
      if (!msg) { msg = 'Post success!'; }
      this.$('.status').text(msg);
    },

    // common helper method for posting and saving drafts
    postHelper: function(isDraft) {
      var entryVal = this.editElem.find('#post').attr('value'),
          entryTitle = this.editElem.find('#postTitle').attr('value');

      this.trigger('postsubmit', { entryVal:   entryVal,
                                   entryTitle: entryTitle,
                                   isDraft:    isDraft });
    },

    handlePostSubmit: function(evt) {
      evt.preventDefault();
      this.postHelper(false);
    },

    handlePwSubmit: function(evt) {
      var pw = this.authForm.children('#pw').attr('value');
      this.trigger('pwsubmit', pw);
      evt.preventDefault();
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
    }
  }),

  BlogController = function() {
    var controller = {
      initialize: function() {
        _.bindAll(this, 'handlePost', 'handlePw');
        this.view = new BlogAdminView();
        this.router = new BlogAdminRouter({
          viewAuth: this.view.viewAuth,
          viewEdit: this.view.viewEdit
        });

        if(!this.pw) {
          this.router.navigate('auth', true);
        }

        this.setupEvents();
        return this;
      },

      setupEvents: function() {
        this.view.bind('postsubmit', this.handlePost);
        this.view.bind('pwsubmit',   this.handlePw);
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
            _this.router.navigate('edit', true);
          }
          else {
            alert('wrong password');
          }
        });
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
