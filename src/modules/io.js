var Io = Class({

  importGPX: function(gpx){
    var gpxDoc = $.parseXML(gpx);
    this.gpx = $(gpxDoc);

    // need to look for trk objects and only import one.
    // trailtech files with a million points really eff thigns up
    // performance validated up to about 5000 points. if we could get 20k out of it that'd be rad
    // but it seems like the google API is the bottleneck
    this.importGPXTracks($.makeArray(this.gpx.find( "trkpt" )));
    this.importGPXWaypoints($.makeArray(this.gpx.find( "wpt" )));
  },

  //
  // TODO in order to improve performance we need to determine if a set of points is colinear
  // if it is, then only plot the bounding end points to the colinear set
  importGPXTracks: function(tracks){
    if(tracks.length > 0){
      console.log(tracks.length);
      tracks = this.parseGpxTracksToArray(tracks);
      var simplify = new Simplify();
      tracks = simplify.simplifyDouglasPeucker(tracks, 0.000000005);
      console.log(tracks.length);
      for(i=0;i<tracks.length;i++){
        var latLng = new google.maps.LatLng(tracks[i].lat, tracks[i].lng);
        app.mapEditor.addRoutePoint(latLng, null, true); //this returns a point
      }
    }
    var latLng = new google.maps.LatLng(tracks[0].lat, tracks[0].lng);
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
      alert("Please double check the route and roadbook and correct any issues which may have occured from importing");
    }
  },

  /*
    try to think of a more efficient way to do this

    TODO we only care if it's close to a trackpoint, not shares it so if it doesn't share, see if it's within like 10 meters or something
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

  parseGpxTracksToArray: function(gpxTracks){
    var tracks = []
    for(i=0;i<gpxTracks.length;i++){
      var pointOne = {lat: parseFloat($(gpxTracks[i]).attr('lat')), lng: parseFloat($(gpxTracks[i]).attr('lon'))}
      var pointTwo = {lat: parseFloat($(gpxTracks[i+1]).attr('lat')),lng: parseFloat($(gpxTracks[i+1]).attr('lon'))}
      if(this.pointsOnPoints(pointOne, pointTwo)){
        continue; //we don't want points on points, or to waste time drawing straight lines
      }
      tracks.push(pointOne);
    }
    return tracks;
  },

  /*
    These might go away in favour of more complex simplification algorithms
  */

  colinearPoints: function(pointOne, pointTwo, pointThree){
    //TODO use area of triangle because we can have vertical stuff
    var area = Math.abs((pointOne.lat*(pointTwo.lng-pointThree.lng)+pointTwo.lat*(pointThree.lng-pointOne.lng)+pointThree.lat*(pointOne.lng-pointTwo.lng))/2)
    return (area < 0.0000001)
  },

  pointsOnPoints: function(pointOne, pointTwo){
    return (pointOne.lat == pointTwo.lat) && (pointOne.lng == pointTwo.lng)
  },
});
