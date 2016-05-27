var Io = Class({

  importGPX: function(gpx){
    var gpxDoc = $.parseXML(gpx);
    var gpx = $(gpxDoc);

    this.importGPXTracks(gpx.find( "trkpt" ));
    this.importGPXWaypoints(gpx.find( "wpt" ));
  },

  importGPXTracks: function(tracks){
    if(tracks.length > 0){
      for(i=0;i<tracks.length;i++){
        var latLng = new google.maps.LatLng($(tracks[i]).attr('lat'), $(tracks[i]).attr('lon'));
        app.mapEditor.addRoutePoint(latLng, null, true); //this returns a point
      }
    }
    // var latLng = new google.maps.LatLng($(tracks[i]).attr('lat'), $(tracks[i]).attr('lon'));
    // app.mapEditor.map.setCenter(latLng);
  },

  importGPXWaypoints: function(waypoints){
    //logic to import into roadbook
    if(waypoints.length > 0){
      for(i=0;i<waypoints.length;i++){
        var latLng = new google.maps.LatLng($(waypoints[i]).attr('lat'), $(waypoints[i]).attr('lon'));
        var index = app.mapEditor.insertPointOnEdge(latLng); //this returns a point
        var routePoint = app.mapEditor.routeMarkers[index];
        routePoint.mapVertexIndex = app.mapEditor.routePoints.indexOf(latLng)
        var opts = app.mapEditor.addWaypoint(routePoint);
        routePoint.waypoint =  app.roadbook.addWaypoint(opts);
      }
    }
  },

  printPDF: function(content){

    var pri = $("#ifmcontentstoprint")[0].contentWindow;
    pri.document.open();
    // var content = "data:text/html;charset=utf-8," + content.html();
    // var pri = window.open(content, "print roadbook","status=1,width=500,height=700")

    pri.document.write(content.html());
    pri.document.close();
    pri.focus();
    pri.print();
  },
});
