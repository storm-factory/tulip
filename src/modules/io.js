var Io = Class({

  importGPX: function(gpx){
    try {
      var gpxDoc = $.parseXML(gpx.trim());
      this.gpx = $(gpxDoc);
    } catch (e) {
      alert("Error parsing GPX :-(");
      app.stopLoading();
      return
    }


    this.importGPXTracks($.makeArray(this.gpx.find( "trkpt" )));
    this.importGPXWaypoints($.makeArray(this.gpx.find( "wpt" )));

    // TODO abstract this to the app as roadbookHasWaypoints
    if(app.mapEditor.routeMarkers[0].waypoint == null){
      this.addWaypoint(app.mapEditor.routeMarkers[0]);
    }
    // TODO abstract this to the app
    if(app.mapEditor.routeMarkers[(app.mapEditor.routeMarkers.length - 1)].waypoint == null){
      this.addWaypoint(app.mapEditor.routeMarkers[(app.mapEditor.routeMarkers.length - 1)]);
    }
    // TODO abstract this to the app
    app.mapEditor.updateRoute();
    // TODO abstract this to the app
    app.roadbook.updateTotalDistance();
  },

  addWaypoint: function(marker){
    var geoData = app.mapEditor.addWaypoint(marker);
    // TODO pass in roadbook
    marker.waypoint =  app.roadbook.addWaypoint(geoData);
  },

  exportGPX: function(){
    var gpxString = "<?xml version='1.0' encoding='UTF-8'?>";
    gpxString += "<gpx xmlns='http://www.topografix.com/GPX/1/1' version='1.1' creator='Tulip' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.topografix.com/GPX/gpx_style/0/2 http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd http://www.topografix.com/GPX/gpx_overlay/0/3 http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd http://www.topografix.com/GPX/gpx_modified/0/1 http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd http://www.topografix.com/GPX/Private/TopoGrafix/0/4 http://www.topografix.com/GPX/Private/TopoGrafix/0/4/topografix.xsd'>";
    var waypoints = "";
    var trackPoints = "<trk><trkseg>";
    // TODO abstract this to the app
    var points = app.mapEditor.routeMarkers;
    var wptCount = 1;
    for(var i=0;i<points.length;i++){
      if(points[i].waypoint !== undefined){
        var name = this.buildNameString(wptCount,points[i].waypoint);
        var desc = this.buildDescString(wptCount,points[i].waypoint);
        var waypoint = "<wpt lat='" + points[i].getPosition().lat() + "' lon='" + points[i].getPosition().lng() + "'><name>" + name + "</name><desc>" + desc + "</desc></wpt>";
        waypoints += waypoint;
        wptCount++;
      }
      var trackPoint = "<trkpt lat='" + points[i].getPosition().lat() + "' lon='" + points[i].getPosition().lng() + "'></trkpt>"
      trackPoints += trackPoint;
    }
    trackPoints += "</trkseg></trk>";
    gpxString += waypoints;
    gpxString += trackPoints;
    gpxString += "</gpx>";

    return gpxString;
  },

  /*
    New rally blitz and rally comp format notification
  */
  buildNameString: function(count,waypoint) {
    var string;
    if(waypoint.notification){
      var type = waypoint.notification.type
      type = (type == "wpm" ? type + count : type).toUpperCase();
      var dist = type == "wpm" ? ":" + waypoint.kmFromStart().toFixed(2) : "";
      var modifier = waypoint.notification.modifier ? ":" + waypoint.notification.modifier : ""
      string = type + modifier + dist;
    }else{
      string = count;
    }
    return string;
  },
  /*
    legacy rally blitz notification
  */
  buildDescString: function(count,waypoint) {
    var string = "";
    if(waypoint.notification){
      var type = waypoint.notification.type
      // TODO Speed Zone
      string = (type == "wpm" ? "WP"+count : (type == "wps" ? "!!!" : (type == "dsz" ? "SZ"+waypoint.notification.modifier : "")));
    }
    return string;
  },

  importGPXTracks: function(tracks){
    if(tracks.length > 0){
      var tracks = this.processGpxTracksForImport(tracks);
      for(i=0;i<tracks.length;i++){

        var latLng = new google.maps.LatLng(tracks[i].lat, tracks[i].lng);
        // TODO abstract this to the app
        app.mapEditor.pushRoutePoint(latLng); //this returns a point
      }
    }
    var latLng = new google.maps.LatLng(tracks[0].lat, tracks[0].lng);
    app.setMapCenter(latLng);
    app.setMapZoom(14);
  },


  importGPXWaypoints: function(waypoints){
    //logic to import into roadbook
    if(waypoints.length > 0){
      for(waypoint of waypoints){
        var index = this.waypointSharesTrackpoint(waypoint);

        if(index == -1){
          var latLng = new google.maps.LatLng($(waypoint).attr('lat'), $(waypoint).attr('lon'));
          // TODO abstract this to the app
          index = app.mapEditor.insertPointOnEdge(latLng, app.mapEditor.routePoints.getArray());
        }

        if(index !== undefined){
          this.addWaypoint(app.mapEditor.routeMarkers[index]);
        }
      }
    }
  },


  parseGpxTracksToArray: function(gpxTracks){
    var tracks = []
    for(var i=0;i<gpxTracks.length;i++){
      var point = {lat: parseFloat($(gpxTracks[i]).attr('lat')), lng: parseFloat($(gpxTracks[i]).attr('lon'))}
      tracks.push(point);
    }
    return tracks;
  },

  processGpxTracksForImport: function(tracks){
    this.tracks = this.parseGpxTracksToArray(tracks);
    var simplify = new Simplify();
    this.tracks = simplify.simplifyDouglasPeucker(this.tracks, 7e-9);
    return this.tracks;
  },

  /*
    try to think of a more efficient way to do this
  */
  waypointSharesTrackpoint: function(waypoint){
    var tracks = this.tracks;
    var index = -1;
    for(var i=0;i<tracks.length;i++){
      if(tracks[i].lat == parseFloat($(waypoint).attr('lat')) && tracks[i].lng == parseFloat($(waypoint).attr('lon'))){
        index = i;
        break;
      }
    }

    return index;
  },
});
