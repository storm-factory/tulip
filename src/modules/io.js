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
    this.tracks = simplify.simplifyDouglasPeucker(this.tracks, 0.000000007); //TODO make import accuracy user configurable
    return this.tracks;
  },

  /*
    try to think of a more efficient way to do this

    TODO we only care if it's close to a trackpoint, not shares it so if it doesn't share, see if it's within like 10 meters or something
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
