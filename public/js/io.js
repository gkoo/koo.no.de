var username,
    socket = new io.Socket(null, {port: 8080, rememberTransport: false}),
    send = function() {
      var input = document.getElementById('chatinput'),
          messageObj = { sender: username, msg: input.value };
      socket.send(messageObj);
      message({ message: ['', messageObj] });
      input.value = '';
    },
    message = function(obj) {
      var el = document.createElement('p');
      if ('announcement' in obj) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
      else if ('message' in obj) { 
        var messageObj = obj.message[1];
        el.innerHTML = '<b>' + esc(messageObj.sender) + ':</b> ' + esc(messageObj.msg);
      }
      document.getElementById('chat-window').appendChild(el);
      document.getElementById('chat-window').scrollTop = 1000000;
    },
    esc = function(msg) {
      return String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

socket.connect();
socket.on('message', function(obj){
  if ('buffer' in obj){
    document.getElementById('chat-window').innerHTML = '';

    for (var i in obj.buffer) message(obj.buffer[i]);
  } else message(obj);
});

$(document).ready(function() {
  $('#chatsendbtn').click(function() {
    send();
  });
  $('#chatinput').keydown(function(e) {
    if (e.keyCode == 13) {
      send();
    }
  });
  username = window.prompt("What is your name?");
});
