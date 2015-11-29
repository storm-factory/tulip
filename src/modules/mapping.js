/*
  PROBLEM: This class is no longer cohesive, there are too many interclass dependencies, lack of DRYness , and too many LOC
  SOLUTIONS.
  TODO make this a module for map route path and maybe also points, make seperate module for listeners, and a final module for waypoints(roadbook module), potentially with observer implimentation
  TODO Impliment Singleton Design Pattern as there can be only one functioning map module at any time. It can then be used across modules safely.
*/
var MapEditor = Class({
  //maintain context in listeners
  _this: {},

  create: function(){
    _this = this;
    this.initMap();
    this.initRoute();
    this.initRouteListeners();
    /*
      displayEdge is a global variable which tracks whether a handle should be shown when the user hovers the mouse over the route.
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
      _this.routePoints.insertAt(index,latLng)
    } else {
      _this.routePoints.push(latLng);
    }
    /*
      Creates a google maps marker to denote a vertex or point on the route polyline and
    */
    var point = new google.maps.Marker({
                      icon: _this.pointIcon(),
                      map: _this.map,
                      position: latLng,
                      draggable: true,
                      mapVertexIndex: _this.routePoints.indexOf(latLng),
                    });

    /*
      Bind the listeners for this point
    */
    _this.initPointListeners(point);

    /*
      Add this point to the marker management array
    */
    if(index){
      _this.routeMarkers.splice(index,0,point);
      _this.incrementRouteVertexIndecies(index);
    } else {
      _this.routeMarkers.push(point);
      //this is the first point and thus the start of the route, make it a waypoint
      if(_this.routeMarkers.length == 1 && _this.routePoints.length == 1) {
        point.setIcon(_this.waypointIcon());
        point.kmFromStart = 0;
        point.miFromStart = 0;
        point.kmFromPrev = 0;
        point.miFromPrev = 0;
        _this.addWaypoint(point);
      }
    }
  },
  /*
    Add a waypoint to the route waypoints array in the proper spot with accurate distance measurements
    and notify the roadbook observer that there is a new waypoint to render
  */
  addWaypoint: function(point) {
      var distances = this.computeDistances(point);

      point.kmFromStart = distances.kmFromStart;
      point.miFromStart = distances.miFromStart;;
      point.kmFromPrev = distances;
      point.miFromPrev = distances;

      //bind the waypoint to this map point and update its icon
      point.waypoint = app.roadbook.addWaypoint(distances);
      point.setIcon(this.waypointIcon());
  },

  /*
    Removes a point or waypoint from the route
  */
  deletePoint: function(point){
    var pointIndex = this.routeMarkers.indexOf(point);
    var vertexIndex = point.mapVertexIndex;
    if(point.waypoint){
      this.deleteWaypoint(point);
    }
    point.setMap(null);
    /*
      Decrement the vertexIndex of each point on the route after the point being
      removed by one.
    */
    if(pointIndex >= 0){
        //remove the marker from our markers array
        this.routeMarkers.splice(pointIndex,1);
        //decriment the remaining point's vertex indecies
        this.decrementRouteVertexIndecies(pointIndex);
        if(vertexIndex >= 0) {
          this.routePoints.removeAt(vertexIndex)
        }
    }
  },
  //TODO If the start waypoint is deleted assign it to the next point in the route
  deleteWaypoint: function(point){
    //remove the waypoint from the roadbook
    app.roadbook.deleteWaypoint(point.waypoint.id);

    //update the point's icon and remove its waypoint object
    point.setIcon(this.pointIcon());
    point.waypoint = null;
  },

  /*
    Determine the distance of a passed in waypoint from the start and from the previous waypoint.

    return an array of these measurements in both impertial and metric
  */
  computeDistances: function(waypoint){
    var waypointIndex = waypoint.mapVertexIndex
    var routePoints = this.routePoints.getArray();
    var points = [];
    switch(waypointIndex) {
      case 0:
        // the first point in the route has a distance of 0
        return {miFromStart: 0,kmFromStart: 0, miFromPrev: 0, kmFromPrev: 0};;
        break;
      case 1:
        // slicing an array with length 2 causes problems
        points.push(routePoints[0]);
        points.push(routePoints[1]);
        break;
      default:
        // slice and dice
        points = routePoints.slice(0, waypointIndex+1)
    }
    var metersFromStart = google.maps.geometry.spherical.computeLength(points);
    //TODO Impliment prev distances
    // var metersFromLastWaypoint = google.maps.geometry.spherical.computeLength(pointsArray.slice(waypointIndex - 1, waypointIndex));

    //do some conversions and return the results
    return {
            miFromStart: (metersFromStart * 0.00062137),
            kmFromStart: (metersFromStart/1000),
            miFromPrev: 0,
            kmFromPrev: 0
          };

  },

  /*
    Compute the cap heading of this waypoint
  */
  computeHeading: function(waypoint){

  },


  /*
    figure out where the user is in the world and center the map there
  */
  attemptGeolocation: function(){
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
        _this.addWaypoint(this);
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
      if(marker.waypoint) {
        var distances = this.computeDistances(marker);
        marker.waypoint.updateWaypoint(distances);
      }
    }
  },


});
