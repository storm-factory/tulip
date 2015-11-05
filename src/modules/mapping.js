
var MapEditor = Class({
  //maintain context in listeners
  _this: {},

  create: function(){
    _this = this;
    this.initializeMap();
    this.initializeRoute();
    this.initializeListeners();
    /*
      displayEdge is a global variable which tracks whether a potential route vertex should be shown when the user hovers the mouse over the route.
    */
    this.displayEdge = true;
    this.attemptGeolocation();
  },

  initializeMap: function(){
    this.map = new google.maps.Map(document.getElementById('map'), {
       center: {lat: 36.068209, lng: -105.629669},
       zoom: 4,
       disableDefaultUI: true,
       mapTypeId: google.maps.MapTypeId.SATELLITE
    });
  },

  initializeRoute: function() {
    /*
      This Polyline object is the backbone of a route.
    */
    this.routePath = new google.maps.Polyline({
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
    this.routePathPoints = this.routePath.getPath();

    /*
      The route point markers array contains the Markers along the route which
      denote the verticies in the route Polyline Object (routePath).

      Points must be inserted into the array in order of distance from the start of the route.
    */
    this.routeMarkers = [];

    /*
      The waypoints array contains the Markers along the route which
      denote the verticies in the route Polyline Object (routePath) which are also waypoints.

      Maintaining this seperate array of waypoints eases the complexity of computing distances along the route

      Waypoints must be inserted into the array in order of distance from the start of the route.
    */
    this.routeWaypoints = [];  //TODO this could almost certainly be implimented as a b-tree, but would the speed advantage be worth the complexity?
  },

  initializeListeners: function() {
    // Add a listener for the map's click event
    // TODO add a switch on this so it can be turned on and off by the app
    this.map.addListener('click', function(evt){
      _this.addRoutePoint(evt.latLng)
    });

    /*
      hovering over the route between verticies will display a potential point, which if clicked on will add a point to the route
    */
    google.maps.event.addListener(this.routePath, 'mouseover', function(evt){
      if(_this.displayEdge){
        var dragging = false;
        var loc;
        var point = new google.maps.Marker({
                                icon: _this.pointIcon(),
                                map: this.map,
                                position: evt.latLng,
                                draggable: true,
                                mapVertex: evt.vertex,
                              });
        google.maps.event.addListener(_this.routePath, 'mousemove', function(evt){
          point.setPosition(evt.latLng);
        });

        google.maps.event.addListener(_this.routePath, 'mouseout', function(evt){
          if(!dragging){
            point.setMap(null);
          }
        });

        google.maps.event.addListener(point, 'mousedown', function(evt){
          console.log('down')
          dragging = true;
          google.maps.event.addListener(point, 'dragging', function(evt){
            console.log('dragging')
            point.setPosition(evt.latLng);
          });
          console.log(dragging);
          loc = evt.latLng;
        });

        google.maps.event.addListener(point, 'mouseup', function(evt){
          dragging = false;
          //it's easier to mess with the array
          var points = _this.routePathPoints.getArray();
          /*
            Iterate through the point pairs on the segment
            determine which edge the click event falls upon
            and insert a new point into route at the index of the end point
            then increment the mapVertexIndex of all the points after that index
          */
          var x0 = loc.lat();
          var y0 = loc.lng();
          // var x0 = evt.latLng.lat();
          // var y0 = evt.latLng.lng();
          for(i = 1; i < points.length; i++ ){
            var x1 = points[i-1].lat();
            var y1 = points[i-1].lng();
            var x2 = points[i].lat();
            var y2 = points[i].lng();
            // does the event point fit in the bounds of the two reference points
            if(((x1 <= x0 && x0 <= x2) || (x1 >= x0 && x0 >= x2)) && ((y1 <= y0 && y0 <= y2) || (y1 >= y0 && y0 >= y2))) {
                _this.addRoutePoint(evt.latLng, i);
                break; //we found it, we're done here
            }
          }
        });
      }
    });

  },

  /*
    an icon which marks a normal point (vertex) on the route Polyline
  */
  pointIcon: function(){
    return {
              path: 'M-1,-1 1,-1 1,1 -1,1z',
              // path: google.maps.SymbolPath.CIRCLE,
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
              // path: google.maps.SymbolPath.CIRCLE,
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
      add this point to the routePath Polyline path MVC array
    */
    if(index){
      _this.routePathPoints.insertAt(index,latLng)
    } else {
      _this.routePathPoints.push(latLng);
    }
    /*
      Creates a google maps marker to denote a vertex or point on the route polyline and
    */
    var point = new google.maps.Marker({
                      icon: _this.pointIcon(),
                      map: _this.map,
                      position: latLng,
                      draggable: true,
                      mapVertexIndex: _this.routePathPoints.indexOf(latLng),
                      isWaypoint: false,
                    });
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
      if(this.isWaypoint){
        this.isWaypoint = false;
        this.setIcon(_this.pointIcon());
      } else {
        this.isWaypoint = true;
        this.setIcon(_this.waypointIcon());
        _this.computeDistances(this.mapVertexIndex);
      }


    });

    /*
      Dragging the point updates the latLng vertex position on the route Polyline
    */
    google.maps.event.addListener(point, 'drag', function(evt) {
      _this.routePathPoints.setAt(this.mapVertexIndex, evt.latLng);
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

    /*
      Add this point to the marker management array
    */
    if(index){
      _this.routeMarkers.splice(index,0,point);
      _this.incrementRouteVertexIndecies(index);
    } else {
      _this.routeMarkers.push(point);
    }
  },

  /*
    Removes a point or waypoint from the route
  */
  deletePoint: function(point){
    var pointIndex = this.routeMarkers.indexOf(point);
    var vertexIndex = point.mapVertexIndex;

    point.setMap(null);
    /*
      Decrement the vertexIndex of each point on the route after the point being
      removed by one.
    */
    if(pointIndex >= 0){
        //remove the marker from our markers array
        this.routeMarkers.splice(pointIndex,1);
        for(i = pointIndex; i < this.routeMarkers.length; i++){
          var point = this.routeMarkers[i];
          point.mapVertexIndex = point.mapVertexIndex - 1;
        }
        if(vertexIndex >= 0) {
          this.routePathPoints.removeAt(vertexIndex)
        }
    }
  },

  /*
    Determine the distance of a passed in waypoint from the start and from the previous waypoint.

    return an array of these measurements in both impertial and metric
  */
  computeDistances: function(waypointIndex){
    var waypointIndex = waypointIndex || this.routePathPoints.length;
    var routePathPoints = this.routePathPoints.getArray();

    var points;
    switch(waypointIndex) {
      case 0:
        // the first point in the route has a distance of 0
        return {startMI: 0,startKM: 0, lastWaypointMI: 0, lastWaypointKM: 0};;
        break;
      case 1:
        // slicing an array with length 2 causes problems
        points = routePathPoints;
        break;
      default:
        // slice and dice
        points = routePathPoints.slice(0, waypointIndex)
    }
    var metersFromStart = google.maps.geometry.spherical.computeLength(points);
    //TODO waypoints need to be fully implimented
    // var metersFromLastWaypoint = google.maps.geometry.spherical.computeLength(pointsArray.slice(waypointIndex - 1, waypointIndex));

    //do some conversions
    var milesFromStart = (metersFromStart * 0.00062137);
    var kmFromStart = (metersFromStart/1000);

    //return
    return {startMI: milesFromStart,startKM: kmFromStart, lastWaypointMI: 0, lastWaypointKM: 0};

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

  },
});
