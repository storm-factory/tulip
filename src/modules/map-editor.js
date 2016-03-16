/*
  PROBLEM: This class is no longer cohesive, there are too many interclass dependencies, lack of DRYness , and too many LOC.
  SOLUTIONS:
  TODO make this a module for map route path and maybe also points, make seperate module for listeners, and a final module for waypoints(roadbook module), potentially with observer implimentation
*/
var MapEditor = Class({
  singleton: true,

  create: function(){
    this.initMap();
    this.initRoute();
    this.initRouteListeners();
    /*
      displayEdge is a instance variable which tracks whether a handle should be shown when the user hovers the mouse over the route.
    */
    this.displayEdge = true;
    this.attemptGeolocation();
  },

  initMap: function(){
    this.map = new google.maps.Map(document.getElementById('map'), {
       center: {lat: 36.068209, lng: -105.629669},
       zoom: 4,
       disableDefaultUI: true,
       mapTypeId: google.maps.MapTypeId.SATELLITE
    });
  },

  initRoute: function() {
    /*
      This Polyline object is the backbone of a route.
    */
    this.route = new google.maps.Polyline({
      strokeColor: '#ffba29',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: this.map,
      geodesic: true,
    });

    /*
      This is an MVC array object which contains the latLng verticies of the route Polyline.

      Adding a latLng object to this array will insert a new vertex onto the route Polyline.

      UI interfacing is accomplished by the following two arrays routeMarkers and routeWaypoints
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

  /*
    Adds a point to the route path points array for manangement
    Since route path points is an MVCArray bound to the route path
    the new point will show up on the route Polyline automagically.

    Listeners are bound to the point to allow it to be toggled as a waypoint or to be removed entirely
  */
  addRoutePoint: function(latLng, index){
    /*
      add this point to the route Polyline path MVC array
    */
    if(index){
      this.routePoints.insertAt(index,latLng)
    } else {
      this.routePoints.push(latLng);
    }
    /*
      Creates a google maps marker to denote a vertex or point on the route polyline and
    */
    var point = new google.maps.Marker({
                      icon: this.pointIcon(),
                      map: this.map,
                      position: latLng,
                      draggable: true,
                      mapVertexIndex: this.routePoints.indexOf(latLng),
                    });

    /*
      Bind the listeners for this point
    */
    this.initPointListeners(point);

    /*
      Add this point to the marker management array
    */
    if(index){
      this.routeMarkers.splice(index,0,point);
      this.incrementRouteVertexIndecies(index);
    } else {
      this.routeMarkers.push(point);
      // this is the first point and thus the start of the route, make it a waypoint
      if(this.routeMarkers.length == 1 && this.routePoints.length == 1) {
        point.kmFromStart = 0;
        point.miFromStart = 0;
        point.kmFromPrev = 0;
        point.miFromPrev = 0;
        point.waypoint = app.roadbook.addWaypoint(this.addWaypoint(point));
      }
    }
    return point;
  },
  /*
    Add a waypoint to the route waypoints array in the proper spot with accurate distance measurements
    and notify the roadbook observer that there is a new waypoint to render

    Returns distance options so a new roadbook waypoint can be built from it.
    The reason we don't just do that here is that it allows the waypoint generation
    workflow to be more generalized
  */
  addWaypoint: function(point) {
      var distances = this.computeDistanceFromStart(point);
      var angles = this.computeHeading(point);
      point.kmFromStart = distances.kmFromStart;
      point.miFromStart = distances.miFromStart;;
      point.heading = angles.heading;

      opts = {
          distances: distances,
          angles: angles,
      }
      //update the waypoint's icon
      point.setIcon(this.waypointIcon());
      //recompute distances between waypoints
      this.updateRoute();
      // return point distance options so a roadbook waypoint can be initialized
      return opts;
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
    if(vertexIndex >= 0){
        //remove the marker from our markers array
        this.routeMarkers.splice(vertexIndex,1);
        //decriment the remaining point's vertex indecies
        this.decrementRouteVertexIndecies(vertexIndex);
        //remove the point from our points array
        this.routePoints.removeAt(vertexIndex)
    }
    this.updateRoute();
  },

  deleteWaypoint: function(point){
    //remove the waypoint from the roadbook
    app.roadbook.deleteWaypoint(point.waypoint.id);

    //If the start waypoint is deleted assign it to the next point in the route
    if(point.mapVertexIndex == 0 && (this.routeMarkers.length > 2)){
      this.addWaypoint(this.routeMarkers[1]);
    }

    //update the point's icon and remove its waypoint object
    point.setIcon(this.pointIcon());
    point.waypoint = null;
  },

  /*
    Determine the distance of a passed in waypoint from the start and from the previous waypoint.

    return an array of these measurements in both impertial and metric
  */
  computeDistanceFromStart: function(point){
    var pointIndex = point.mapVertexIndex;
    var routePoints = this.routePoints.getArray();
    var points = [];
    switch(pointIndex) {
      case 0:
        // the first point in the route has a distance of 0
        return {miFromStart: 0,kmFromStart: 0};;
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
            miFromStart: (metersFromStart * 0.00062137),
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
        return {miFromPrev: 0, kmFromPrev: 0};;
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
            miFromPrev: (metersFromPrev * 0.00062137),
            kmFromPrev: (metersFromPrev/1000),
          };
  },

  /*
    Compute the cap heading of this waypoint
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
    figure out where the user is in the world and center the map there
  */
  attemptGeolocation: function(){
    var _this = this;
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      _this.map.setCenter(pos);
      _this.map.setZoom(8);
    });

    //TODO make the map enter on the latLng of the start of a route if one is loaded
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

  initPointListeners: function(point){
    var _this = this;
    /*
      right clicking on a route point removes it from the route
    */
    google.maps.event.addListener(point, 'rightclick', function(evt) {
      _this.deletePoint(this);
      _this.displayEdge = true;
    });

    /*
      double clicking on a route point toggles whether the point is a waypoint or not
    */
    google.maps.event.addListener(point, 'dblclick', function(evt) {
      //If the point has a waypoint remove it, otherwise add one
      if(this.waypoint){
        _this.deleteWaypoint(this);
      } else {
        this.waypoint = app.roadbook.addWaypoint(_this.addWaypoint(this));
      }
    });

    /*
      Dragging the point updates the latLng vertex position on the route Polyline
    */
    google.maps.event.addListener(point, 'drag', function(evt) {
      _this.routePoints.setAt(this.mapVertexIndex, evt.latLng);
    });

    google.maps.event.addListener(point, 'dragend', function(evt) {
      _this.updateRoute();
    });

    /*
      turns off display of the potential point marker on the route path so UI functions over a point are not impeeded.
    */
    google.maps.event.addListener(point, 'mouseover', function(evt) {
      _this.displayEdge = false;
    });
    /*
      turns display of the potential point marker on the route path back on.
    */
    google.maps.event.addListener(point, 'mouseout', function(evt) {
      _this.displayEdge = true;
    });
  },

  initRouteListeners: function() {
    var _this = this;
    // Add a listener for the map's click event
    // TODO add a switch on this so it can be turned on and off by the app
    this.map.addListener('click', function(evt){
      _this.addRoutePoint(evt.latLng)
    });

    /*
      hovering over the route between verticies will display a handle, which if clicked on will add a point to the route
    */
    google.maps.event.addListener(this.route, 'mouseover', function(evt){
      /*
        If we aren't over a point display a handle to add a new route point
      */
      if(_this.displayEdge){
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
          if(_this.displayEdge){
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
          //it's easier to mess with the array
          var points = _this.routePoints.getArray();
          /*
            Iterate through the point pairs on the segment
            determine which edge the click event falls upon
            and insert a new point into route at the index of the end point
            then increment the mapVertexIndex of all the points after that index
          */
          // TODO refactor this logic into it's own function exactly like the waypoint insertion method in the roadbook module
          var x0 = evt.latLng.lat();
          var y0 = evt.latLng.lng();
          var idx;
          var done;
          for(i = 1; i < points.length; i++ ){
            var x1 = points[i-1].lat();
            var y1 = points[i-1].lng();
            var x2 = points[i].lat();
            var y2 = points[i].lng();
            // does the event point fit in the bounds of the two reference points
            if(((x1 <= x0 && x0 <= x2) || (x1 >= x0 && x0 >= x2)) && ((y1 <= y0 && y0 <= y2) || (y1 >= y0 && y0 >= y2))) {
                idx = i;
                _this.addRoutePoint(evt.latLng, i);
                break; //we found it, we're done here
            }
          }
          /*
            Add listeners to move the new route point and the route to the mouse drag position of the handle
          */
          google.maps.event.addListener(handle, 'drag', function(evt){
            var point = _this.routeMarkers[idx];
            point.setPosition(evt.latLng);
            _this.routePoints.setAt(point.mapVertexIndex, evt.latLng);
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

  updateRoute: function() {
    for(i = 0; i < this.routeMarkers.length; i++) {
      var marker = this.routeMarkers[i];
      var previous;
      if(marker.waypoint) {
        var distances = this.computeDistanceFromStart(marker);
        var angles = this.computeHeading(marker);
        if(previous) {
          $.extend(distances,this.computeDistanceBetweenPoints(previous,marker));
        } else {
          $.extend(distances,{miFromPrev: 0, kmFromPrev: 0});
        }
        marker.waypoint.updateWaypoint(distances, angles.heading);
        previous = marker;
      }
    }
  },


});
