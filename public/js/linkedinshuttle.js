$(function() {
  var container = $('#container'),
      li_latlng = '37.423327,-122.071152',

  drawMap = function(lat, lng) {
    var latlng = new google.maps.LatLng(lat, lng),
        myOptions = { zoom: 13,
                      center: latlng,
                      mapTypeId: google.maps.MapTypeId.ROADMAP
                    },
        map = new google.maps.Map(document.getElementById("map_canvas"), myOptions),
        marker = new google.maps.Marker({ position: latlng,
                                          map: map });
  },

  handleTrackingData = function(attr) {
    // create map
    var latitude = attr.Latitude,
        longitude = attr.Longitude,
        distanceUrl = 'http://maps.googleapis.com/maps/api/distancematrix/json?sensor=false&origins='+latitude+','+longitude+'&destinations='+li_latlng,

        newDataList = $('<ul>'),
        relevantFields = ['MaxSpeed',
                          'AvgSpeed',
                          'InstSpeed',
                          'StreetName',
                          'City',
                          'Zip'],
        i, len, fieldName, fieldValue, newDataItem;

    drawMap(latitude, longitude);
    $.ajax(distanceUrl, {
      dataType: 'jsonp',
      success: function(data, textStatus) {
        console.log('here');
      }
    });

    for (i=0,len=relevantFields.length; i<len; ++i) {
      fieldName = relevantFields[i];
      if (fieldName) {
        fieldValue = attr[fieldName];
        newDataItem = $('<li>').text(fieldName + ': ' + fieldValue);
        newDataList.append(newDataItem);
      }
    }
    container.append(newDataList);
  };

  $.ajax('http://64.87.15.235/networkfleetcar/getfleetgpsinfoextended?u=linked-in&p=linkedin', {
    crossDomain: true,
    dataType: 'jsonp',
    success: function(data, textStatus) {
      var obj, attr, latitude, longitude, i, len, field;
      if (!data || !data.features || !data.features.length) {
        return;
      }
      attr = data.features[0].attributes;
      if (!attr) return;
      handleTrackingData(attr);
    }
  });
});
