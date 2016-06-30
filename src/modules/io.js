var Io = Class({

  importGPX: function(gpx){
    var gpxDoc = $.parseXML(gpx);
    this.gpx = $(gpxDoc);

    this.importGPXTracks($.makeArray(this.gpx.find( "trkpt" )));
    this.importGPXWaypoints($.makeArray(this.gpx.find( "wpt" )));

    if(app.mapEditor.routeMarkers[0].waypoint == null){
      this.addWaypoint(0);
    }
    if(app.mapEditor.routeMarkers[(app.mapEditor.routeMarkers.length - 1)].waypoint == null){
      this.addWaypoint(app.mapEditor.routeMarkers.length - 1);
    }
    app.mapEditor.updateRoute();
    app.roadbook.updateTotalDistance();
  },

  addWaypoint: function(index){
    var routePoint = app.mapEditor.routeMarkers[index];
    var opts = app.mapEditor.addWaypoint(routePoint);
    routePoint.waypoint =  app.roadbook.addWaypoint(opts);
  },

  exportGPX: function(){
    var gpxString = "<?xml version='1.0' encoding='UTF-8'?>";
    gpxString += "<gpx xmlns='http://www.topografix.com/GPX/1/1' version='1.1' creator='Tulip' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.topografix.com/GPX/gpx_style/0/2 http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd http://www.topografix.com/GPX/gpx_overlay/0/3 http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd http://www.topografix.com/GPX/gpx_modified/0/1 http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd http://www.topografix.com/GPX/Private/TopoGrafix/0/4 http://www.topografix.com/GPX/Private/TopoGrafix/0/4/topografix.xsd'>";
    var waypoints = "";
    var trackPoints = "<trk><trkseg>";
    var points = app.mapEditor.routeMarkers;
    var wptCount = 0;
    for(i=0;i<points.length;i++){
      if(points[i].waypoint !== undefined){
        var waypoint = "<wpt lat='" + points[i].getPosition().lat() + "' lon='" + points[i].getPosition().lng() + "'><name>" + wptCount + "</name></wpt>";
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

  importGPXTracks: function(tracks){
    if(tracks.length > 0){
      var tracks = this.processGpxTracksForImport(tracks);
      for(i=0;i<tracks.length;i++){
        var latLng = new google.maps.LatLng(tracks[i].lat, tracks[i].lng);
        app.mapEditor.addRoutePoint(latLng, null, true); //this returns a point
      }
    }
    var latLng = new google.maps.LatLng(tracks[0].lat, tracks[0].lng);
    app.map.setCenter(latLng);
  },


  importGPXWaypoints: function(waypoints){
    //logic to import into roadbook
    if(waypoints.length > 0){

      for(waypoint of waypoints){
        var index = this.waypointSharesTrackpoint(waypoint);
        if(index == -1){
          var latLng = new google.maps.LatLng($(waypoint).attr('lat'), $(waypoint).attr('lon'));
          index = app.mapEditor.insertPointOnEdge(latLng);
        }
        if(index !== undefined){
          this.addWaypoint(index);
        }
      }
    }
  },


  parseGpxTracksToArray: function(gpxTracks){
    var tracks = []
    for(i=0;i<gpxTracks.length;i++){
      var pointOne = {lat: parseFloat($(gpxTracks[i]).attr('lat')), lng: parseFloat($(gpxTracks[i]).attr('lon'))}
      var pointTwo = {lat: parseFloat($(gpxTracks[i+1]).attr('lat')),lng: parseFloat($(gpxTracks[i+1]).attr('lon'))}
      tracks.push(pointOne);
    }
    return tracks;
  },

  processGpxTracksForImport: function(tracks){
    this.tracks = this.parseGpxTracksToArray(tracks);
    var simplify = new Simplify();
    this.tracks = simplify.simplifyDouglasPeucker(this.tracks, 0.000000007);
    return this.tracks;
  },

  /*
    try to think of a more efficient way to do this
  */
  waypointSharesTrackpoint: function(waypoint){
    var tracks = this.tracks;
    var index = -1;
    for(i=0;i<tracks.length;i++){
      if(tracks[i].lat == parseFloat($(waypoint).attr('lat')) && tracks[i].lng == parseFloat($(waypoint).attr('lon'))){
        index = i;
        break;
      }
    }

    return index;
  },
});
