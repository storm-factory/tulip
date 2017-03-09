/*
  PROBLEM: This class does map stuff... It should be broken into more specific classes
  SOLUTIONS: map-util, map route object, map waypoint object.. something along those lines
  // TODO is it possible to sepereate this into a model object which keeps track of data structures and a controller object which interfaces with the UI?
  the model object will have to know about the app and the roadbook. not sure how we want to interface that? maybe route everything through the app?
*/
var MapEditor = Class({

  create: function(){
    this.initMap();
    this.initRoute();
    this.initRouteListeners();
    this.dialog = require('electron').remote.dialog;
    /*
      displayEdge is a instance variable which tracks whether a handle should be shown when the user hovers the mouse over the route.
    */
    this.displayEdge = true;
    this.mapUnlocked = true;
    this.deleteQueue = [];
  },

  initMap: function(){
    this.map = new google.maps.Map(document.getElementById('map'), {
       center: {lat: 36.068209, lng: -105.629669},
       zoom: 4,
       disableDefaultUI: true,
       mapTypeId: google.maps.MapTypeId.HYBRID,
    });
  },

  initRoute: function() {
    /*
      This Polyline object is the backbone of a route.
    */
    this.route = new google.maps.Polyline({
      strokeColor: '#ffba29',
      strokeOpacity: 1.0,
      strokeWeight: 6,
      map: this.map,
    });

    /*
      This is an MVC array object which contains the latLng verticies of the route Polyline.

      Adding a latLng object to this array will insert a new vertex onto the route Polyline.

      UI interfacing is accomplished by the following two arrays routeMarkers and routePoints
    */
    this.routePoints = this.route.getPath();

    /*
      The route point markers array contains the Markers along the route which
      denote the verticies in the route Polyline Object (route).

      Points must be inserted into the array in order of distance from the start of the route.
    */
    this.routeMarkers = [];
  },

  /*
    an icon which marks a normal point (vertex) on the route Polyline
  */
  vertexIcon: function(){
    return {
              path: 'M-1,-1 1,-1 1,1 -1,1z',
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ffba29',
              fillColor: '#787878',
              fillOpacity: 1
            };
  },

  /*
    an icon which marks a waypoint (vertex) on the route Polyline
  */
  waypointIcon: function(){
    return {
              path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ff9000',
              fillColor: '#ff4200',
              fillOpacity: 1
            };
  },

  /*
    an icon which marks a waypoint (vertex) on the route Polyline
  */
  deleteQueueIcon: function(){
    return {
              path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ff4200',
              fillColor: '#ff9000',
              fillOpacity: 1
            };
  },

  routeMarker: function(latLng){
    return new google.maps.Marker({
                      icon: this.vertexIcon(),
                      map: this.map,
                      position: latLng,
                      draggable: true,
                      routePointIndex: this.routePoints.length > 0 ? this.routePoints.indexOf(latLng) : 0,
                    });
  },

  waypointBubble: function(radius,center,fill){
    return new google.maps.Circle({
            strokeColor: fill,
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: fill,
            fillOpacity: 0.2,
            clickable: false,
            map: this.map,
            center: center,
            radius: Number(radius)
          });
  },

  /*
    Adds a point to the route path points array for manangement
    Since route path points is an MVCArray bound to the route path
    the new point will show up on the route Polyline automagically.

    Listeners are bound to the point to allow it to be toggled as a waypoint or to be removed entirely
  */
  pushRoutePoint: function(latLng,supressWpt){
    /*
      add this point to the route Polyline path MVC array
    */
    this.routePoints.push(latLng);
    /*
      Creates a google maps marker to denote a vertex or point on the route polyline and
    */
    var index = this.routePoints.length > 0 ? this.routePoints.indexOf(latLng) : 0 //if it's the first point it won't be in the routePoints array
    var marker = this.routeMarker(latLng, index);

    /*
      Bind the listeners for this point
      NOTE this could probably even get moved out to the caller
    */
    this.initMarkerListeners(marker);

    /*
      Add this point to the marker management array
    */
    this.routeMarkers.push(marker);
    // this is the first point and thus the start of the route, make it a waypoint, but not if the roadbook is being loaded from js
    return marker;
  },

  /*
    splices point into route
  */
  insertRoutePointAt: function(latLng, index){
    /*
      add this point to the route Polyline path MVC array
    */
    this.routePoints.insertAt(index,latLng)
    /*
      Creates a google maps marker to denote a vertex or point on the route polyline and
    */
    var marker = this.routeMarker(latLng, index);

    /*
      Bind the listeners for this point
      NOTE this could probably even get moved out to the caller
    */
    this.initMarkerListeners(marker);

    /*
      Add this point to the marker management array
      at the specified index
    */
      this.routeMarkers.splice(index,0,marker);
    /*
      update the indexes after the route marker since they are now inaccurate
    */
    this.incrementRouteVertexIndecies(index);
    return marker;
  },

  /*
    Add a waypoint to the route waypoints array in the proper spot with accurate distance measurements
    and notify the roadbook observer that there is a new waypoint to render

    Returns distance options so a new roadbook waypoint can be built from it.
    The reason we don't just do that here is that it allows the waypoint generation
    workflow to be more generalized
  */
  addWaypoint: function(marker) {
    //update the waypoint marker's icon
    marker.setIcon(this.waypointIcon());
    // return point geoData so a roadbook waypoint can be created
    return this.getWaypointGeodata(marker);
  },
  /*
    Add a bubble to a marker
    NOTE not sure if this is exactly how we want to do things but we are in the crawl phase.
  */
  addWaypointBubble: function(routePointIndex,radius,fill) {
    var marker = this.routeMarkers[routePointIndex];
    var bubble = this.waypointBubble(radius, marker.getPosition(), fill);
    marker.bubble = bubble;
  },

  getWaypointGeodata: function(marker){
    var prevWaypointIndex = this.getPrevWaypointRoutePointIndex(marker.routePointIndex,this.routeMarkers);
    var heading = this.computeHeading(marker, this.routePoints);
    return {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      routePointIndex: marker.routePointIndex,
      distances: {
                    kmFromStart: this.computeDistanceBetweenPoints(0,marker.routePointIndex),
                    kmFromPrev: this.computeDistanceBetweenPoints(prevWaypointIndex,marker.routePointIndex)
                  },
      angles: {
        heading: heading,
        relativeAngle: this.computeRelativeAngle(marker,this.routePoints,heading)
      }

    }
  },

  getPrevWaypointRoutePointIndex: function(routePointIndex,markersArray){
    var index = 0;
    for(var i=routePointIndex-1;i>0;i--){
      if(markersArray[i].waypoint){
        index = i;
        break;
      }
    }
    return index;
  },
  /*
    takes a response from google maps directions API and appends it to the route
    NOTE needs refactored to be more SOLID and testable
  */
  appendGoogleDirectionsToMap: function(data){
    var steps = data.routes[0].legs[0].steps
    for(var i=0;i<steps.length;i++){
      var stepPoints = google.maps.geometry.encoding.decodePath(steps[i].polyline.points);
      // NOTE if we change the simplified lib and also the io module to just use google maps LatLng objects instead of literals we could skip this.
      var points = []
      for(var k=0;k<stepPoints.length;k++){
        var point = {lat: stepPoints[k].lat(), lng: stepPoints[k].lng()}
        points.push(point);
      }
      var simplify = new Simplify();
      points = simplify.simplifyDouglasPeucker(points, 7e-9);

      for (var j=1;j<points.length;j++){
        var latLng = new google.maps.LatLng(points[j].lat, points[j].lng);
        var marker = this.pushRoutePoint(latLng);
        if(j == points.length-1){
          // TODO how can we abstract this?
          marker.waypoint = app.roadbook.addWaypoint(this.addWaypoint(marker));
        }

      }
    }
    this.updateRoute();
  },

  /*
    determines which points to delete between the user defined delete points
  */
  clearPointDeleteQueue: function(deleteQueue, routeMarkers){
    deleteQueue.sort(function(a,b){return a - b});
    var start = deleteQueue[0];
    var end = deleteQueue[1];
    for(var i = end;i >= start;i--){
      if(routeMarkers[i].waypoint){
        this.deleteWaypoint(routeMarkers[i]);
      }
      this.deletePoint(routeMarkers[i]);
    }
  },

  returnPointToNaturalColor: function(marker){
    if(marker.waypoint){
      marker.setIcon(app.mapEditor.waypointIcon());
    }else {
      marker.setIcon(app.mapEditor.vertexIcon());
    }
  },

  /*
    Removes a point or waypoint from the route
  */
  deletePoint: function(marker){
    var pointIndex = marker.routePointIndex;
    this.deleteWaypointBubble(pointIndex);
    marker.setMap(null);
    //remove the point from our points array
    this.routePoints.removeAt(pointIndex)
    //remove the marker from our markers array
    this.routeMarkers.splice(pointIndex,1);
    /*
      Decrement the pointIndex of each point on the route after the point being
      removed by one.
    */
    this.decrementRouteVertexIndecies(pointIndex);

  },

  deleteWaypoint: function(marker){
    //remove the waypoint from the roadbook
    app.roadbook.deleteWaypoint(marker.waypoint.id); //TODO how can we abstract this?
    //update the point's icon and remove its waypoint object
    marker.setIcon(this.vertexIcon());
    this.deleteWaypointBubble(marker.routePointIndex);
    marker.waypoint = null;
  },

  deleteWaypointBubble: function(routePointIndex){
    if(this.routeMarkers[routePointIndex].bubble){
      this.routeMarkers[routePointIndex].bubble.setMap(null);
    }
  },

  computeDistanceBetweenPoints: function(beginMarkerRoutePointIndex, endMarkerRoutePointIndex){
    var routePoints = this.routePoints.getArray();
    var points = [];
    for(var i=beginMarkerRoutePointIndex;i<endMarkerRoutePointIndex+1;i++){
      points.push(routePoints[i]);
    }

    //do some conversions and return the results
    return google.maps.geometry.spherical.computeLength(points)/1000;
  },

  /*
    Compute the cap heading of this waypoint
  */
  computeHeading: function(marker, routePoints){
    var pointIndex = marker.routePointIndex;
    var nextPointIndex = pointIndex+1 < routePoints.getLength() ? pointIndex + 1 : pointIndex;

    //the heading is from this point to the next one
    var heading = google.maps.geometry.spherical.computeHeading(routePoints.getAt(pointIndex), routePoints.getAt(nextPointIndex));
    //google maps headings are between [-180,180] so convert them to a compass bearing
    if(heading < 0){
      heading = 360 + heading;
    }
    return heading;
  },

  /*
    Compute the angle of the turn from the previous heading to this one
  */
  computeRelativeAngle: function(marker,routePoints,heading){
    var pointIndex = marker.routePointIndex;
    var prevPointIndex = pointIndex-1 > 0 ? pointIndex - 1 : 0;
    var relativeAngle = ((0 == pointIndex) || (routePoints.getLength()-1 == pointIndex)) ? 0 : heading - google.maps.geometry.spherical.computeHeading(routePoints.getAt(prevPointIndex), routePoints.getAt(pointIndex));
    // we want to limit what we return to being 0 < angle < 180 for right turns and 0 > angle > -180 for left turns
    if(relativeAngle > 180) {
      relativeAngle = -(360 - relativeAngle); //left turn
    } else if ( relativeAngle < -180) {
      relativeAngle = (360 + relativeAngle); //right turn
    }
    return relativeAngle;
  },

  /*
    increments the route vertex index of each point along the route after the passed in index
  */
  incrementRouteVertexIndecies: function(startIndex) {
    startIndex++;
    for(i = startIndex; i < this.routeMarkers.length; i++){
      var marker = this.routeMarkers[i];
      marker.routePointIndex = marker.routePointIndex + 1;
    }
  },

  /*
    decrements the route vertex index of each point along the route after the passed in index
  */
  decrementRouteVertexIndecies: function(startIndex) {
    for(i = startIndex; i < this.routeMarkers.length; i++){
      var point = this.routeMarkers[i];
      point.routePointIndex = point.routePointIndex - 1;
    }
  },

  insertPointOnEdge: function(latLng, points){
    /*
      Iterate through the point pairs on the segment
      determine which edge the latLng falls upon
      and insert a new point into route at the index of the edge point
    */
    var idx;

    var tolerance = this.getEdgeTolerance();
    for(i = 1; i < points.length; i++ ){
      // does the event point fit in the bounds of the two reference points before and after the click
      var path = [points[i-1],points[i]];
      var line = new google.maps.Polyline({path: path});

      if(google.maps.geometry.poly.isLocationOnEdge(latLng, line, tolerance)) {
        idx = i;
        this.insertRoutePointAt(latLng, i);
        break; //we found it, we're done here
      }
      //we haven't found it, increse the tolerance and start over
      if(i == points.length - 1 ){
        tolerance = tolerance*2;
        i = 0;
      }
    }
    return idx;
  },

  /*
    calculates a tolerance for determining if a location falls on an edge based on map zoom level
  */
  getEdgeTolerance: function(){
    return Math.pow(this.map.getZoom(), -(this.map.getZoom()/5));
  },

  updateWaypointBubble: function(routePointIndex,bubble){
    if(this.routeMarkers[routePointIndex].bubble){
      this.routeMarkers[routePointIndex].bubble.setRadius(Number(bubble));
    }
  },

  updateRoute: function() {
    for(var i = 0; i < this.routeMarkers.length; i++) {
      var marker = this.routeMarkers[i];
      if(this.routeMarkers[i].waypoint) {
        var geoData = this.getWaypointGeodata(marker);
        marker.waypoint.updateWaypoint(geoData, marker.routePointIndex);
      }
    }
    app.roadbook.updateTotalDistance();
  },

  // TODO this would be in some map controller module
  initMarkerListeners: function(marker){
    var _this = this; //NOTE this will end up being some sort of abstraction of the map model

    /*
      When two items are in the queue, all points in between are deleted.
    */
    google.maps.event.addListener(marker, 'click', function(evt) {
      if(this.waypoint && !app.pointDeleteMode){
        // TODO make into waypoint function and abstract it from here
        $('#roadbook').scrollTop(0);
        $('#roadbook').scrollTop(($(this.waypoint.element).offset().top-100));
      }
    });

    /*
      right clicking on a route point adds it to delete queue.
    */
    google.maps.event.addListener(marker, 'rightclick', function(evt) {
      app.pointDeleteMode = true;
      if(_this.deleteQueue.length == 0){
        _this.deleteQueue.push(marker.routePointIndex);
        marker.setIcon(_this.deleteQueueIcon());
      } else {
        _this.deleteQueue.push(marker.routePointIndex);
        _this.clearPointDeleteQueue(_this.deleteQueue, _this.routeMarkers);
        _this.updateRoute();
        _this.displayEdge = true; //we have to set this because the mouse out handler that usually handles this gets nuked in the delete
        _this.deleteQueue = [];
        app.pointDeleteMode = false
      }
    });

    /*
      double clicking on a route point toggles whether the point is a waypoint or not
    */
    google.maps.event.addListener(marker, 'dblclick', function(evt) {
      //If the point has a waypoint remove it, otherwise add one
      if(!app.pointDeleteMode){
        if(this.waypoint){
          _this.deleteWaypoint(this);
        } else {
          this.waypoint = app.roadbook.addWaypoint(_this.addWaypoint(this));
          $('#roadbook').scrollTop(0);
          $('#roadbook').scrollTop(($(this.waypoint.element).offset().top-100));
        }
        //recompute distances between waypoints
        _this.updateRoute();
      }
    });

    /*
      Dragging the point updates the latLng vertex position on the route Polyline
    */
    google.maps.event.addListener(marker, 'drag', function(evt) {
      _this.routePoints.setAt(this.routePointIndex, evt.latLng);
      if(this.bubble){
        this.bubble.setCenter(evt.latLng);
      }
    });

    google.maps.event.addListener(marker, 'dragend', function(evt) {
      _this.updateRoute();
    });

    /*
      turns off display of the potential point marker on the route path so UI functions over a point are not impeeded.
    */
    google.maps.event.addListener(marker, 'mouseover', function(evt) {
      _this.displayEdge = false;
      if(app.pointDeleteMode){
        marker.setIcon(_this.deleteQueueIcon())
      }
    });

    /*
      turns display of the potential point marker on the route path back on.
    */
    google.maps.event.addListener(marker, 'mouseout', function(evt) {
      _this.displayEdge = true;
      if(app.pointDeleteMode && (marker.routePointIndex != _this.deleteQueue[0])){
        _this.returnPointToNaturalColor(marker);
      }
    });
  },


  // TODO this would be in some map controller module
  lockMap: function(){
    this.mapUnlocked = false;
    this.lockMarkers();
  },
  // TODO this would be in some map controller module
  unlockMap: function(){
    this.mapUnlocked = true;
    this.unlockMarkers();
  },
  // TODO this would be in some map controller module
  lockMarkers: function(){
    for(var i=0;i<this.routeMarkers.length;i++){
      this.routeMarkers[i].setDraggable(false);
    }
  },
  // TODO this would be in some map controller module
  unlockMarkers: function(){
    for(var i=0;i<this.routeMarkers.length;i++){
      this.routeMarkers[i].setDraggable(true);
    }
  },
  // TODO this would be in some map controller module (basically change out this for model and move the map initialize to the controller)
  initRouteListeners: function() {
    var _this = this;
    // Add a listener for the map's click event
    this.map.addListener('click', function(evt){
      if(_this.mapUnlocked && !app.pointDeleteMode){
        // TODO this stays in the model as wrapped in a method
        var marker = _this.pushRoutePoint(evt.latLng)

        //if this is the first point on the route make it a waypoint
        if(_this.routeMarkers.length == 1 && _this.routePoints.length == 1) {
          marker.kmFromStart = 0;
          marker.kmFromPrev = 0;
          // TODO how to refactor this? perhaps this should be two methods?s
          marker.waypoint = app.roadbook.addWaypoint(_this.addWaypoint(marker));
        }

        _this.updateRoute();
      }
    });

    this.map.addListener('rightclick', function(evt){

      var autotrace = _this.dialog.showMessageBox({type: "question",
                                                   buttons: ["Cancel","Ok"],
                                                  defaultId: 1,
                                                  message: "About to auto-trace roads to your route, Are you sure?"});
      // TODO this stays in the model as wrapped in a method
      if(_this.mapUnlocked && !app.pointDeleteMode && (autotrace == 1)){
        if(_this.routePoints.length >0){
          var startSnap = _this.routePoints.getArray().slice(-1).pop();
          var endSnap = evt.latLng;
          var url = "https://maps.googleapis.com/maps/api/directions/json?"
                      + "origin="+startSnap.lat()+","
                      + startSnap.lng()
                      + "&destination=" + endSnap.lat()+","
                      + endSnap.lng()
                      + "&key=" + api_keys.google_directions
          $.get(url,function(data){
            if(data.status == "OK"){
              _this.appendGoogleDirectionsToMap(data);
            }
          });
        }else {
          _this.pushRoutePoint(evt.latLng)
          _this.updateRoute();
        }

      }
    });

    /*
      hovering over the route between verticies will display a handle, which if clicked on will add a point to the route
      // TODO put me in a map polyline listeners wrapper
    */
    google.maps.event.addListener(this.route, 'mouseover', function(evt){
      /*
        If we aren't over a point display a handle to add a new route point if the map is editable
      */
      if(_this.displayEdge && !app.pointDeleteMode){ //these two guys need moved to the map controller since they monitor UI state
        // TODO this stays in the model as wrapped in a method
        var dragging = false;
        var loc;
        var handle = new google.maps.Marker({
                                icon: _this.vertexIcon(),
                                map: this.map,
                                position: evt.latLng,
                                draggable: true,
                                zIndex: -1,
                              });
        google.maps.event.addListener(_this.route, 'mousemove', function(evt){
          if(_this.displayEdge && _this.mapUnlocked){
            handle.setPosition(evt.latLng);
          } else {
            handle.setMap(null);
          }
        });

        /*
          make the point go away if the mouse leaves the route, but not if it's being dragged
        */
        google.maps.event.addListener(_this.route, 'mouseout', function(evt){
          if(!dragging){
            handle.setMap(null);
          }
        });

        /*
          add the point to the route
        */
        google.maps.event.addListener(handle, 'mousedown', function(evt){
          dragging = true;
          var idx = _this.insertPointOnEdge(evt.latLng, _this.routePoints.getArray());
          /*
            Add listeners to move the new route point and the route to the mouse drag position of the handle
          */
          google.maps.event.addListener(handle, 'drag', function(evt){
            if(idx !== undefined){ //in rare instances this can happen and causes the map to glitch out
              var point = _this.routeMarkers[idx];
              point.setPosition(evt.latLng);
              _this.routePoints.setAt(point.routePointIndex, evt.latLng);
            }
          });

          /*
            get rid of the handle
          */
          google.maps.event.addListener(handle, 'mouseup', function(evt){
            dragging = false;
            _this.updateRoute();
            this.setMap(null);
          });
        });
      }
    });
  },
});
