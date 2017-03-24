var test = require( 'tape' );
var model = require('../../src/models/map-model.js').mapModel;

test( 'Makes the first point added to the route a waypoint', function( assert ) {
  var mapModel = new model();
  var waypoint;
  mapModel.route = [];
  mapModel.makeFirstRoutePointWaypoint({}, function(marker){waypoint = marker;});
  assert.equal(waypoint, undefined, "Does not run the callback if there are no points in the route")

  mapModel.route.push(1);
  mapModel.makeFirstRoutePointWaypoint({}, "not a function");
  assert.equal(waypoint, undefined, "Does not run the callback if it is not a function")

  mapModel.makeFirstRoutePointWaypoint({}, function(marker){waypoint = marker;});

  assert.ok( waypoint, 'Runs the callback if it is a function and there are points in the route' );
  assert.equal(waypoint.kmFromStart, 0, 'Sets the distance from start to 0');
  assert.equal(waypoint.kmFromPrev, 0, 'Sets the distance from previous waypoint to 0');

  assert.end();
} );


test( 'Adds a point to the route by updating the polyline and puting a marker over that vertex on the polyline', function(assert){
  var mapModel = new model();
  var polylineLatLng, markerLatLng, markerMap, callbackRan;
  var testLatLng = {lat: 123, lng: 456};

  mapModel.addLatLngToRoutePolyline = function(latLng){ polylineLatLng = latLng; };
  mapModel.addRoutePointMarker = function(latLng,map){ markerLatLng = latLng; markerMap = map; };

  mapModel.addRoutePoint(testLatLng,"i'm a map", function(){ callbackRan = true; });

  assert.deepEqual(testLatLng,polylineLatLng, "It adds the lat lng to the polyline");
  assert.deepEqual(markerLatLng,markerLatLng, "It creates a marker at the correct lat lng");
  assert.ok(markerMap,"i'm a map", "It passes the map to the route marker");
  assert.ok(callbackRan, "It runs a callback if it is a function");

  callbackRan = false;
  mapModel.addRoutePoint(testLatLng,"i'm a map", "i'm not a function");
  assert.equal(callbackRan, false, "Does not run the callback if it is not a function")

  assert.end();
});
