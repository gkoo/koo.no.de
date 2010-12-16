var socket = new io.Socket(null, {port: 8080, rememberTransport: false}); 
socket.connect();
socket.on('message', function(obj){
  if ('buffer' in obj){
    document.getElementById('chat-window').innerHTML = '';

    for (var i in obj.buffer) message(obj.buffer[i]);
  } else message(obj);
});

var send = function() {
  var input = document.getElementById('chatinput');
  var val = input.value;
  socket.send(val);
  message({ message: ['you', val]});
  input.value = '';
};

var message = function(obj) {
  var el = document.createElement('p');
  if ('announcement' in obj) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
  else if ('message' in obj) el.innerHTML = '<b>' + esc(obj.message[0]) + ':</b> ' + esc(obj.message[1]);
  document.getElementById('chat-window').appendChild(el);
  document.getElementById('chat-window').scrollTop = 1000000;
}

var esc = function(msg) {
  return String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

$(document).ready(function() {
  $('#chatsendbtn').click(function() {
    send();
  });
  $('#chatinput').keydown(function(e) {
    if (e.keyCode == 13) {
      send();
    }
  });
});
