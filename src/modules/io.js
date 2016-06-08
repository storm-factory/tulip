var Io = Class({

  importGPX: function(gpx){
    var gpxDoc = $.parseXML(gpx);
    var gpx = $(gpxDoc);

    this.importGPXTracks($.makeArray(gpx.find( "trkpt" )));
    this.importGPXWaypoints($.makeArray(gpx.find( "wpt" )));
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
        var latLng = new google.maps.LatLng($(waypoint).attr('lat'), $(waypoint).attr('lon'));
        if(app.mapEditor.routePoints.indexOf(latLng) > 0){ //this doesn't work because it's not the same object though they may have the same lat/lon need to perform iteration to check
            console.log("found one");
        }
        var index = app.mapEditor.insertPointOnEdge(latLng); //this returns a point
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
      alert("Importing gpx waypoints into a roadbook is an imperfect science, please double check the route and roadbook and correct any issues which may have occured");
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
