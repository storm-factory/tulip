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
  var pointIcon = {
            path: 'M-1,-1 1,-1 1,1 -1,1z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ffba29',
            fillColor: '#787878',
            fillOpacity: 1
          };


  assert.deepEqual(this.mapEditor.pointIcon(), pointIcon, "It can initialize a route point icon")

  pointIcon = {
            path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ff9000',
            fillColor: '#ff4200',
            fillOpacity: 1
          };

  assert.deepEqual(this.mapEditor.waypointIcon(), pointIcon, "It can initialize a route waypoint icon")

  pointIcon = {
            path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ff4200',
            fillColor: '#ff9000',
            fillOpacity: 1
          };

  assert.deepEqual(this.mapEditor.deleteQueueIcon(), pointIcon, "It can initialize a route delete queue point icon")
});
// {lat: 36.068209, lng: -105.629669}
QUnit.test("Describe addRoutePoint", function( assert ) {
  var point = new google.maps.LatLng(36.068209, -105.629669);

  var returnedPoint = this.mapEditor.addRoutePoint(point, null, true);
  assert.ok(this.mapEditor.routePoints.getArray()[0].lat().toFixed(6) == 36.068209 && this.mapEditor.routePoints.getArray()[0].lng().toFixed(6) == -105.629669, "it sets route point" )
  assert.deepEqual(this.mapEditor.routeMarkers[0], returnedPoint, 'it creates a route marker and adds it to the route markers array')
});

QUnit.test("Describe addWaypoint", function( assert ) {
  var pointIcon = {
            path: 'M-1,-1 1,-1 1,1 -1,1z',
            scale: 7,
            strokeWeight: 2,
            strokeColor: '#ffba29',
            fillColor: '#787878',
            fillOpacity: 1
          };

  var marker = new google.maps.Marker({
                    icon: pointIcon,
                    map: this.mapEditor.map,
                    position: new google.maps.LatLng(36.068209, -105.629669),
                    draggable: true,
                    mapVertexIndex: 0,
                  });

  var returnedOpts = this.mapEditor.addWaypoint(marker);
  var opts = {"lat":36.068209,"lng":-105.62966900000004,"mapVertexIndex":0,"distances":{"kmFromStart":0},"angles":{"heading":0,"relativeAngle":0}}
  assert.deepEqual(returnedOpts, opts, '?')

});
