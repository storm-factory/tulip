/*
  PROBLEM: This class is no longer cohesive, there are too many interclass dependencies, lack of DRYness , and too many LOC.
  SOLUTIONS:
  TODO make this a module for map route path and maybe also points, make seperate module for listeners, and a final module for waypoints(roadbook module), potentially with observer implimentation
*/
var MapEditor = Class({

  create: function(){
    this.initMap();
    this.initRoute();
    this.initRouteListeners();
    /*
      displayEdge is a instance variable which tracks whether a handle should be shown when the user hovers the mouse over the route.
    */
    this.displayEdge = true;
    this.pointDeleteQueue = [];
    // this.attemptGeolocation();
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
  pointIcon: function(){
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

  routeMarker: function(latLng){
    return new google.maps.Marker({
                      icon: this.pointIcon(),
                      map: this.map,
                      position: latLng,
                      draggable: true,
                      mapVertexIndex: this.routePoints.length > 0 ? this.routePoints.indexOf(latLng) : 0,
                    });
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
    NOTE this function does too many things, it should just change the icon, and the opts part should be another function (if that is even needed as updateRoute basically handles it)
  */
  addWaypoint: function(marker) {
    //update the waypoint marker's icon
    marker.setIcon(this.waypointIcon());
    // return point geoData so a roadbook waypoint can be created
    return this.getWaypointGeodata(marker);
  },

  getWaypointGeodata: function(marker){
    var distances = this.computeDistanceFromStart(marker);
    var angles = this.computeHeading(marker);
    return {
        lat: marker.getPosition().lat(),
        lng: marker.getPosition().lng(),
        mapVertexIndex: marker.mapVertexIndex,
        distances: distances,
        angles: angles,
    }
  },
  /*
    takes a response from google maps directions API and appends it to the route
    NOTE needs refactored to be more SOLID and testable
  */
  appendGoogleDirectionsToMap: function(data){
    var steps = data.routes[0].legs[0].steps
    var waypoints = [];
    for(var i=0;i<steps.length;i++){
      var stepPoints = google.maps.geometry.encoding.decodePath(steps[i].polyline.points);

      // NOTE if we change the simplified lib and also the io module to just use google maps LatLng objects instead of literals we could skip this.
      var points = []
      for(k=0;k<stepPoints.length;k++){
        var point = {lat: stepPoints[k].lat(), lng: stepPoints[k].lng()}
        points.push(point);
      }
      var simplify = new Simplify();
      points = simplify.simplifyDouglasPeucker(points, 7e-9);

      for (j=1;j<points.length;j++){
        var latLng = new google.maps.LatLng(points[j].lat, points[j].lng);
        var marker = this.pushRoutePoint(latLng);
        //take the last point in the steps and add it to an array to turn into a waypoint later
        // NOTE if we allow update route to redraw unedited tulips we can skip this.
        if(j == points.length-1){
          waypoints.push(marker)
        }
      }
    }
    // add the waypoints in
    for(i=0;i<waypoints.length;i++){
        waypoints[i].waypoint = app.roadbook.addWaypoint(this.addWaypoint(waypoints[i]));
    }
    this.updateRoute();
  },

  addToPointDeleteQueue: function(index){
    if(this.pointDeleteQueue.length == 0){
      this.pointDeleteQueue.push(index);
      this.routeMarkers[index].setIcon(this.deleteQueueIcon());
    } else {
      this.pointDeleteQueue.push(index);
      this.clearPointDeleteQueue();
    }
  },

  clearPointDeleteQueue: function(){
    this.pointDeleteQueue.sort(function(a,b){return a - b});
    var start = this.pointDeleteQueue[0];
    var end = this.pointDeleteQueue[1];
    for(var i = end;i >= start;i--){
      this.deletePoint(this.routeMarkers[i]);
    }
    this.updateRoute();
    this.displayEdge = true; //we have to set this because the mouse out handler that usually handles this gets nuked in the delete
    this.pointDeleteQueue = [];
    app.pointDeleteMode = false
  },

  returnPointToNaturalColor: function(point){
    if(point.waypoint){
      point.setIcon(app.mapEditor.waypointIcon());
    }else {
      point.setIcon(app.mapEditor.pointIcon());
    }
  },

  /*
    Removes a point or waypoint from the route
  */
  deletePoint: function(point){
    var vertexIndex = point.mapVertexIndex;
    if(point.waypoint){
      this.deleteWaypoint(point);
    }
    point.setMap(null);
    /*
      Decrement the vertexIndex of each point on the route after the point being
      removed by one.
    */
    if(vertexIndex >= 0){ //NOTE else what? why is this here?
        //remove the marker from our markers array
        this.routeMarkers.splice(vertexIndex,1);
        //decriment the remaining point's vertex indecies
        this.decrementRouteVertexIndecies(vertexIndex);
        //remove the point from our points array
        this.routePoints.removeAt(vertexIndex)
    }
  },

  deleteWaypoint: function(marker){
    //remove the waypoint from the roadbook
    app.roadbook.deleteWaypoint(marker.waypoint.id);

    //If the start waypoint is deleted assign it to the next point in the route
    if(marker.mapVertexIndex == 0 && (this.routeMarkers.length > 2)){
      this.addWaypoint(this.routeMarkers[1]);
    }

    //update the point's icon and remove its waypoint object
    marker.setIcon(this.pointIcon());
    marker.waypoint = null;
  },

  /*
    Determine the distance of a passed in waypoint from the start and from the previous waypoint.

    return an array of these measurements in both impertial and metric
  */
  computeDistanceFromStart: function(point){
    var pointIndex = point.mapVertexIndex;
    var routePoints = this.routePoints.getArray(); //should get passed in
    var points = [];
    switch(pointIndex) {
      case 0:
        // the first point in the route has a distance of 0
        return {kmFromStart: 0};
        break;
      case 1:
        // slicing an array with length 2 causes problems
        points.push(routePoints[0]);
        points.push(routePoints[1]);
        break;
      default:
        // slice and dice (we add one to the point index because slice is not inclusive)
        points = routePoints.slice(0, pointIndex+1)
    }
    var metersFromStart = google.maps.geometry.spherical.computeLength(points);

    //do some conversions and return the results
    return {
            kmFromStart: (metersFromStart/1000),
          };

  },

  computeDistanceBetweenPoints: function(previousPoint, point){
    var previousPointIndex = previousPoint.mapVertexIndex;
    var pointIndex = point.mapVertexIndex;
    var routePoints = this.routePoints.getArray();
    var points = [];
    switch(pointIndex) {
      case 0:
        // the first point in the route has a distance of 0
        return {kmFromPrev: 0};;
        break;
      case 1:
        // slicing an array with length 2 causes problems
        points.push(routePoints[0]);
        points.push(routePoints[1]);
        break;
      default:
        // slice and dice (we add one to the pointIndex because slice is not inclusive)
        points = routePoints.slice(previousPointIndex , pointIndex+1)
    }
    var metersFromPrev = google.maps.geometry.spherical.computeLength(points);

    //do some conversions and return the results
    return {
            kmFromPrev: (metersFromPrev/1000),
          };
  },

  /*
    Compute the cap heading of this waypoint
    // TODO Seperate descisions from actions
  */
  computeHeading: function(point){
    // google.maps.geometry.spherical.computeHeading(from:LatLng, to:LatLng)
    //not the first or last
    var pointIndex = point.mapVertexIndex;
    var heading = 0;
    var relativeAngle = 0;

    //the heading is from this point to the last one
    //the relative angle is the heading minus the heading from the last point to this one
    if(pointIndex != 0 && pointIndex != (this.routePoints.getLength()-1)){
      heading = google.maps.geometry.spherical.computeHeading(point.getPosition(), this.routePoints.getAt(pointIndex+1));

      relativeAngle = heading - google.maps.geometry.spherical.computeHeading(this.routePoints.getAt(pointIndex-1), point.getPosition());
      // we want to limit what we return to being 0 < angle < 180 for right turns and 0 > angle > -180 for left turns
      if(relativeAngle > 180) {
        //left turn
        relativeAngle = -(360 - relativeAngle);
      } else if ( relativeAngle < -180) {
        //right turn
        relativeAngle = (360 + relativeAngle);
      }
    } else if(pointIndex == 0){
      // the first point in the route has a heading to the next point
      if(this.routePoints.getLength() > 1) {
        heading = google.maps.geometry.spherical.computeHeading(point.getPosition(), this.routePoints.getAt(1));
        relativeAngle = 0;
      } else{
        heading = 0;
        relativeAngle = 0;
      }

    } else if(pointIndex == (this.routePoints.getLength()-1)){
      // the last point in the route has a heading to the previous point
      heading = google.maps.geometry.spherical.computeHeading(this.routePoints.getAt(pointIndex-1), point.getPosition());
      relativeAngle = 0;
    }
    return {
      heading: this.convertHeadingToBearing(heading),
      relativeAngle: relativeAngle
    };
  },

  /*
    google maps headings are between [-180,180] so convert them to a compass bearing
  */
  convertHeadingToBearing(heading){
    if(heading < 0){
      heading = 360 + heading;
    }
    return heading;
  },

  /*
    increments the route vertex index of each point along the route after the passed in index
  */
  incrementRouteVertexIndecies: function(startIndex) {
    startIndex++;
    for(i = startIndex; i < this.routeMarkers.length; i++){
      var point = this.routeMarkers[i];
      point.mapVertexIndex = point.mapVertexIndex + 1;
    }
  },

  /*
    decrements the route vertex index of each point along the route after the passed in index
  */
  decrementRouteVertexIndecies: function(startIndex) {
    for(i = startIndex; i < this.routeMarkers.length; i++){
      var point = this.routeMarkers[i];
      point.mapVertexIndex = point.mapVertexIndex - 1;
    }
  },

  insertPointOnEdge: function(latLng, points){
    /*
      Iterate through the point pairs on the segment
      determine which edge the latLng falls upon
      and insert a new point into route at the index of the edge point
      then increment the mapVertexIndex of all the points after that index
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
      //we haven't found it, increse the tolerance
      //and start over
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

  updateRoute: function() {
    var previous;
    for(i = 0; i < this.routeMarkers.length; i++) {
      var marker = this.routeMarkers[i];
      // var previous;
      if(marker.waypoint) {
        var distances = this.computeDistanceFromStart(marker);
        var angles = this.computeHeading(marker);
        if(previous) {
          $.extend(distances,this.computeDistanceBetweenPoints(previous,marker));
        } else {
          $.extend(distances,{kmFromPrev: 0});
        }
        previous = marker;
        // TODO just needs to be an object
        marker.waypoint.updateWaypoint(distances, angles,{lat: marker.getPosition().lat(), lng: marker.getPosition().lng()}, marker.mapVertexIndex );
      }
    }
    app.roadbook.updateTotalDistance();
  },

  initMarkerListeners: function(marker){
    var _this = this;

    /*
      When two items are in the queue, all points in between are deleted.
    */
    google.maps.event.addListener(marker, 'click', function(evt) {
      if(this.waypoint && !app.pointDeleteMode){
        // TODO make into waypoint function
        $('#roadbook').scrollTop(0);
        $('#roadbook').scrollTop(($(this.waypoint.element).offset().top-100));
      }
    });

    /*
      right clicking on a route point adds it to delete queue.
    */
    google.maps.event.addListener(marker, 'rightclick', function(evt) {
      app.pointDeleteMode = true;
      _this.addToPointDeleteQueue(this.mapVertexIndex);
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
          //recompute distances between waypoints
          _this.updateRoute();
        }
      }
    });

    /*
      Dragging the point updates the latLng vertex position on the route Polyline
    */
    google.maps.event.addListener(marker, 'drag', function(evt) {
      if(!app.pointDeleteMode){
        _this.routePoints.setAt(this.mapVertexIndex, evt.latLng);
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
      if(app.pointDeleteMode && (marker.mapVertexIndex != _this.pointDeleteQueue[0])){
        _this.returnPointToNaturalColor(marker);
      }
    });
  },

  initRouteListeners: function() {
    var _this = this;
    // Add a listener for the map's click event
    this.map.addListener('click', function(evt){
      if(app.canEditMap && !app.pointDeleteMode){
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
      if(app.canEditMap && !app.pointDeleteMode){
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
    */
    google.maps.event.addListener(this.route, 'mouseover', function(evt){
      /*
        If we aren't over a point display a handle to add a new route point if the map is editable
      */
      if(_this.displayEdge && !app.pointDeleteMode){
        var dragging = false;
        var loc;
        var handle = new google.maps.Marker({
                                icon: _this.pointIcon(),
                                map: this.map,
                                position: evt.latLng,
                                draggable: true,
                                zIndex: -1,
                              });
        google.maps.event.addListener(_this.route, 'mousemove', function(evt){
          if(_this.displayEdge && app.canEditMap){
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
              _this.routePoints.setAt(point.mapVertexIndex, evt.latLng);
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
