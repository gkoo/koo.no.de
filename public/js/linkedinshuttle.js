$(function() {
  var googleMapsUrl = 'http://maps.googleapis.com/maps/api/staticmap?zoom=14&size=512x512&maptype=roadmap&sensor=false',
      markerArg = '&markers=color:green%7Clabel:G%7C',
      mapImg = $('#map'),
      container = $('#container'),

  handleTrackingData = function(attr) {
    // create map
    var latitude = attr.Latitude,
        longitude = attr.Longitude,
        url = googleMapsUrl + markerArg + latitude + ',' + longitude,
        newDataList = $('<ul>'),
        relevantFields = ['MaxSpeed',
                          'AvgSpeed',
                          'InstSpeed',
                          'StreetName',
                          'City',
                          'Zip'],
        i, len, fieldName, fieldValue, newDataItem;
    mapImg.attr('src', url)
          .show();

    for (i=0,len=relevantFields.length; i<len; ++i) {
      fieldName = relevantFields[i];
      fieldValue = attr[fieldName];
      newDataItem = $('<li>').text(fieldName + ': ' + fieldValue);
      newDataList.append(newDataItem);
    }
    container.append(newDataList);
  };

  $.ajax('http://64.87.15.235/networkfleetcar/getfleetgpsinfoextended?u=linked-in&p=linkedin', {
    crossDomain: true,
    dataType: 'jsonp',
    success: function(data, textStatus) {
      var obj, attr, latitude, longitude, i, len, field, url;
      if (!data || !data.features || !data.features.length) {
        return;
      }
      attr = data.features[0].attributes;
      if (!attr) return;
      handleTrackingData(attr);
    }
  });
});
