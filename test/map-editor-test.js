QUnit.module( "MapEditor", {
  before: function() {
  },
  beforeEach: function() {
    this.mapEditor = new MapEditor();
    this.mapEditor.map = map;
  },
  afterEach: function() {

  },
  after: function() {

  }
});

QUnit.test("Describe initialize route", function( assert ) {
  var route = this.mapEditor.route


  assert.equal(this.mapEditor.routePoints, route.getPath(), "It can initialize a route polyline and assign its path to a variable")
  assert.ok(this.mapEditor.routeMarkers instanceof Array, "It can initialize a route markers array")
});

QUnit.test("Describe initialize point literals", function( assert ) {
  var vertexIcon = {
            path: 'M-1,-1 1,-1 1,1 -1,1z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ffba29',
            fillColor: '#787878',
            fillOpacity: 1
          };


  assert.deepEqual(this.mapEditor.vertexIcon(), vertexIcon, "It can initialize a route point icon")

  vertexIcon = {
            path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ff9000',
            fillColor: '#ff4200',
            fillOpacity: 1
          };

  assert.deepEqual(this.mapEditor.waypointIcon(), vertexIcon, "It can initialize a route waypoint icon")

  vertexIcon = {
            path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ff4200',
            fillColor: '#ff9000',
            fillOpacity: 1
          };

  assert.deepEqual(this.mapEditor.deleteQueueIcon(), vertexIcon, "It can initialize a route delete queue point icon")
});
// {lat: 36.068209, lng: -105.629669}
QUnit.test("Describe pushRoutePoint", function( assert ) {
  var point = new google.maps.LatLng(36.068209, -105.629669);

  var returnedPoint = this.mapEditor.pushRoutePoint(point);
  assert.ok(this.mapEditor.routePoints.getArray()[0].lat().toFixed(6) == 36.068209 && this.mapEditor.routePoints.getArray()[0].lng().toFixed(6) == -105.629669, "it sets a route point at the specified lat long" )
  assert.deepEqual(this.mapEditor.routeMarkers[0], returnedPoint, 'it creates a route marker and pushes it to the route markers array')

  var point2 = new google.maps.LatLng(37.068209, -108.629669);
  var returnedPoint2 = this.mapEditor.pushRoutePoint(point2);

  var routePointLen = this.mapEditor.routePoints.getArray().length-1;
  assert.ok(this.mapEditor.routePoints.getArray()[routePointLen].lat().toFixed(6) == 37.068209 && this.mapEditor.routePoints.getArray()[routePointLen].lng().toFixed(6) == -108.629669, "it pushes the route point onto the end of the routePoints array" )

  var markerLen = this.mapEditor.routeMarkers.length-1;
  assert.deepEqual(this.mapEditor.routeMarkers[markerLen],returnedPoint2, 'it pushes the route point marker onto the end of the markers array');
});

QUnit.test("Describe insertRoutePointAt", function( assert ) {
  var point = new google.maps.LatLng(36.068209, -105.629669);
  var point2 = new google.maps.LatLng(37.068209, -106.629669);
  var point3 = new google.maps.LatLng(38.068209, -107.629669);
  var pushedPoint = this.mapEditor.pushRoutePoint(point);
  var pushedPoint2 = this.mapEditor.pushRoutePoint(point2);

  assert.ok(this.mapEditor.routePoints.getArray()[0].lat().toFixed(6) == 36.068209 && this.mapEditor.routePoints.getArray()[0].lng().toFixed(6) == -105.629669, "it sets a route point at the specified lat long" )
  assert.deepEqual(this.mapEditor.routeMarkers[0], pushedPoint, 'it creates a route marker and pushes it to the route markers array')

  var point2 = new google.maps.LatLng(37.068209, -108.629669);
  var pushedPoint2 = this.mapEditor.pushRoutePoint(point2);

  var routePointLen = this.mapEditor.routePoints.getArray().length-1;
  assert.ok(this.mapEditor.routePoints.getArray()[routePointLen].lat().toFixed(6) == 37.068209 && this.mapEditor.routePoints.getArray()[routePointLen].lng().toFixed(6) == -108.629669, "it pushes the route point onto the end of the routePoints array" )

  var markerLen = this.mapEditor.routeMarkers.length-1;
  assert.deepEqual(this.mapEditor.routeMarkers[markerLen],pushedPoint2, 'it pushes the route point marker onto the end of the markers array');
});

QUnit.test("Describe addWaypoint", function( assert ) {
  var vertexIcon = {
            path: 'M-1,-1 1,-1 1,1 -1,1z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ffba29',
            fillColor: '#787878',
            fillOpacity: 1
          };

  var marker = this.mapEditor.routeMarker(new google.maps.LatLng(36.068209, -105.629669),0)
  this.mapEditor.computeDistanceBetweenPoints = function() {return 0}
  var returnedOpts = this.mapEditor.addWaypoint(marker);
  var opts = {"lat":36.068209,"lng":-105.62966900000004,"routePointIndex":0,"distances":{"kmFromStart":0, kmFromPrev: 0},"angles":{"heading":0,"relativeAngle":0}}
  assert.deepEqual(returnedOpts, opts, '?')

});

QUnit.test("Describe clearPointDeleteQueue", function( assert ) {
  var pointsDeleted = [];
  var waypointsDeleted = [];
  var rbWaypointsDeleted = [];

  this.mapEditor.deletePoint = function(marker){ pointsDeleted.push(marker.index);};
  this.mapEditor.deleteWaypoint = function(marker){ waypointsDeleted.push(marker.index);};

  var markersArray = function(){
    return [
        {index: 0, waypoint: true},
        {index: 1, waypoint: false},
        {index: 2, waypoint: false},
        {index: 3, waypoint: false},
        {index: 4, waypoint: true},
        {index: 5, waypoint: true},
        {index: 6, waypoint: false},
        {index: 7, waypoint: false},
        {index: 8, waypoint: true},
        {index: 9, waypoint: true},
    ];
  }

  this.mapEditor.clearPointDeleteQueue([2,5], markersArray());

  assert.deepEqual(pointsDeleted, [5,4,3,2],"It sends the right index numbers to deletePoint");
  assert.deepEqual(waypointsDeleted, [5,4],"It sends the right index numbers to deleteWaypoint");
});

QUnit.test("Describe getPrevWaypointRoutePointIndex", function( assert ) {
  var markersArray = [
        {index: 0, waypoint: true},
        {index: 1, waypoint: false},
        {index: 2, waypoint: false},
        {index: 3, waypoint: false},
        {index: 4, waypoint: true},
        {index: 5, waypoint: true},
        {index: 6, waypoint: false},
        {index: 7, waypoint: false},
        {index: 8, waypoint: true},
        {index: 9, waypoint: true},
    ];

  var index = this.mapEditor.getPrevWaypointRoutePointIndex(4,markersArray);
  assert.equal(index, 0, "It can find the previous waypoint index");
  index = this.mapEditor.getPrevWaypointRoutePointIndex(0,markersArray);
  assert.equal(index, 0, "It returns 0 for the first waypoint index");
});
