$(function() {
  var eggTriggerEl = $('#dontclickme'),
  handleClick = function() {
    var eggParent = $('#egg-container'), eggEl, header, conclude, img;

    $(window).scrollTop(0);
    if (eggParent.length) {
      // egg element already exists, just show it.
      eggParent.show();
      return;
    }
    eggEl = $('<div>').addClass('egg')
                      .wrap($('<div id="egg-container">'));
    eggParent = eggEl.parent();
    header = $('<h1>').text('You found the easter egg!');
    img = $('<img src="/img/resume_egg.jpg">'),
    conclude = $('<h2>Happy Easter!</h2>');

    eggEl.append(header, img, conclude);
    eggParent.click(function() {
      $(this).hide();
    });

    $('#main').append(eggParent);
  };
  eggTriggerEl.click(handleClick);
});
