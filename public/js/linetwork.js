var onLinkedInLoad;

$(function() {
  var connectionCallback = function(connections) {
    console.log(connections);
  },
  onLinkedInAuth = function() {
    var fields = ['first-name', 'last-name', 'picture-url']
    IN.API.Connections("me")
      .fields(fields)
      .result(connectionCallback);
  };

  onLinkedInLoad = function () {
    IN.Event.on(IN, "auth", onLinkedInAuth);
  };
});
