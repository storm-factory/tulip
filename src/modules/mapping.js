
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
       mapTypeId: google.maps.MapTypeId.HYBRID
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
    this.routeWaypoints = [];
  },

  initializeListeners: function() {
    // Add a listener for the click event
    this.map.addListener('click', this.addRoutePoint);
    
    /*
      hovering over the route between verticies will display a potential point, which if clicked on will add a point to the route
    */
    google.maps.event.addListener(this.routePath, 'mousemove', function(evt){
      //TODO still needs to add new vertex
      if(_this.displayEdge){
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
          point.setMap(null);
        });

        google.maps.event.addListener(point, 'click', function(evt){
          var points = _this.routePathPoints;
          //iterate through pairs of points
          //if point falls between the point pairs put it on that segment
          //TODO wire this part up

        });
      }
    });

  },

  /*
    an icon which marks a normal point (vertex) on the route Polyline
  */
  pointIcon: function(){
    return {
              path: google.maps.SymbolPath.CIRCLE,
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
              path: google.maps.SymbolPath.CIRCLE,
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
  addRoutePoint: function(evt){
    /*
      add this point to the routePath Polyline path MVC array
    */
    _this.routePathPoints.push(evt.latLng);
    /*
      Creates a google maps marker to denote a vertex or point on the route polyline and
    */
    var point = new google.maps.Marker({
                      icon: _this.pointIcon(),
                      map: _this.map,
                      position: evt.latLng,
                      draggable: true,
                      mapVertexIndex: _this.routePathPoints.indexOf(evt.latLng),
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
      turns off display of the potential point marker on the route path so other UI functions are not impeeded.
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
    _this.routeMarkers.push(point);
  },

  /*
    Removes a point or waypoint from the route
  */
  deletePoint: function(point){
    var pointIndex = this.routeMarkers.indexOf(point);
    var vertexIndex = point.mapVertexIndex;

    point.setMap(null);
    /*
      Reduce the vertexIndex of each point on the route after the point being
      removed by one.
    */
    if(pointIndex >= 0){
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

    var waypointIndex = waypointIndex || this.waypointIndex.length;
    var pointsArray = this.routePathPoints.getArray();
    //get the meters then convert so we are only making a single call to the Google API per measurement needed
    var metersFromStart = google.maps.geometry.spherical.computeLength(pointsArray.slice(0, waypointIndex));
    var metersFromLastWaypoint = google.maps.geometry.spherical.computeLength(pointsArray.slice(waypointIndex - 1, waypointIndex));
    console.log(metersFromStart);
    console.log(metersFromLastWaypoint);

    //do some conversions
    // var milesFromStart =
    //
    // return {startMI: 0,startKM: 0, lastWaypointMI: 0, lastWaypointKM: 0};

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
});
