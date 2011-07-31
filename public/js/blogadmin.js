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
      _.bindAll(this,
                'doAuth',
                'postSuccess',
                'handlePostSubmit',
                'handlePwSubmit',
                'viewAuth',
                'viewEdit',
                'switchView');

      this.router = new BlogAdminRouter({
        viewAuth: this.viewAuth,
        viewEdit: this.viewEdit
      });
      this.authElem = this.$('.auth');
      this.editElem = this.$('.edit');
      this.authForm = this.authElem.find('.blogAuthForm');

      if(!this.pw) {
        this.router.navigate('auth', true);
      }
    },

    events: {
      'submit .blogAuthForm': 'handlePwSubmit',
      'submit .createPostForm': 'handlePostSubmit'
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

    doAuth: function(pw, callback) {
      $.post('/blog-auth', { 'pw': pw }, function(res) {
        if (res && res.success) {
          callback(res.success);
        }
      });
    },

    postSuccess: function(msg) {
      if (!msg) { msg = 'Post success!'; }
      this.$('.status').text(msg);
    },

    handlePostSubmit: function(evt) {
      var pw,
          entryVal = this.editElem.find('#post').attr('value'),
          entryTitle = this.editElem.find('#postTitle').attr('value'),
          data;

      evt.preventDefault();
      if (!this.pw) {
        this.router.navigate('auth', true);
        return;
      }

      data = { pw: this.pw,
               title: entryTitle,
               entry: entryVal };

      console.log(data);

      $.post('/blog-post',
             data,
             function(data, textStatus) {
               alert('success');
             });
    },

    handlePwSubmit: function(evt) {
      var _this = this;
      this.pw = this.authForm.children('#pw').attr('value');
      if (!this.pw) { return; }
      this.doAuth(this.pw, function(success) {
        if (success) {
          _this.router.navigate('edit', true);
        }
        else {
          alert('wrong password');
        }
      });
      evt.preventDefault();
    }
  }),

  view = new BlogAdminView();
});
