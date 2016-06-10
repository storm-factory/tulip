var Io = Class({

  importGPX: function(gpx){
    var gpxDoc = $.parseXML(gpx);
    this.gpx = $(gpxDoc);

    this.importGPXTracks($.makeArray(this.gpx.find( "trkpt" )));
    this.importGPXWaypoints($.makeArray(this.gpx.find( "wpt" )));
  },

  importGPXTracks: function(tracks){
    if(tracks.length > 0){
      for(i=0;i<tracks.length;i++){
        var latLng = new google.maps.LatLng($(tracks[i]).attr('lat'), $(tracks[i]).attr('lon'));
        if($(tracks[i]).attr('lat') == $(tracks[i+1]).attr('lat') && $(tracks[i]).attr('lon') == $(tracks[i+1]).attr('lon')){
          continue; //we don't want points on points
        }
        app.mapEditor.addRoutePoint(latLng, null, true); //this returns a point
      }
    }
    var latLng = new google.maps.LatLng($(tracks[0]).attr('lat'), $(tracks[0]).attr('lon'));
    app.mapEditor.map.setCenter(latLng);
  },

  importGPXWaypoints: function(waypoints){
    //logic to import into roadbook
    var problems = false;
    if(waypoints.length > 0){
      for(waypoint of waypoints){
        var index = this.waypointSharesTrackpoint(waypoint);
        if(index == -1){
          var latLng = new google.maps.LatLng($(waypoint).attr('lat'), $(waypoint).attr('lon'));
          index = app.mapEditor.insertPointOnEdge(latLng);
        }
        if(index !== undefined){
          var routePoint = app.mapEditor.routeMarkers[index];
          var opts = app.mapEditor.addWaypoint(routePoint);
          routePoint.waypoint =  app.roadbook.addWaypoint(opts);
        }else {
          problems = true;
        }
      }
    }
    if(problems){
      alert("There were some problems placing all of the waypoints, please double check the route and roadbook and correct any issues which may have occured");
    }
  },

  /*
    try to think of a more efficient way to do this
  */
  waypointSharesTrackpoint: function(waypoint){
    var tracks = $.makeArray(this.gpx.find( "trkpt" ));
    var index = -1;
    for(i=0;i<tracks.length;i++){
      if($(tracks[i]).attr('lat') == $(waypoint).attr('lat') && $(tracks[i]).attr('lon') == $(waypoint).attr('lon')){
        index = i;
        break;
      }
    }

    return index;
  },
});
