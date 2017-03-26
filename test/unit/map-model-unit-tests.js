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
  var polylineLatLng, markerLatLng, markerMap, updated;
  var testLatLng = {lat: 123, lng: 456};

  mapModel.addLatLngToRoutePolyline = function(latLng){ polylineLatLng = latLng; };
  mapModel.addRoutePointMarker = function(latLng,map){ markerLatLng = latLng; markerMap = map; };
  mapModel.updateRoute = function(){updated = true;}

  mapModel.addRoutePoint(testLatLng,"i'm a map");

  assert.deepEqual(testLatLng,polylineLatLng, "It adds the lat lng to the polyline");
  assert.deepEqual(markerLatLng,markerLatLng, "It creates a marker at the correct lat lng");
  assert.equal(markerMap,"i'm a map", "It passes the map to the route marker");
  assert.ok(updated,"i updated the route");

  assert.end();
});

test( 'Generates a Google Directions request URL', function(assert){
  var mapModel = new model();
  var origin = {lat: function(){return 123}, lng: function(){return 456}};
  var destination = {lat: function(){return 789}, lng: function(){return 321}};
  var direction_api_key = "im_an_api_key"

  var request = "https://maps.googleapis.com/maps/api/directions/json?"
            + "origin="+origin.lat()+","+ origin.lng()
            + "&destination=" + destination.lat()+","+ destination.lng()
            + "&key=" + direction_api_key
  assert.equal(mapModel.buildDirectionsRequestURL(origin,destination,direction_api_key), request, "Returns a properly formatted request");
  assert.end();
});

test( 'Gets the last item in an array', function(assert){
  var mapModel = new model();
  assert.equal(mapModel.getLastItemInArray([1,2,3]), 3, "It returns the last item when given an array");
  assert.end();
});

test( 'Gets the geodata for a waypoint', function(assert){
  var mapModel = new model();
  var markers = [4,5,6];
  var route = {getArray: function(){return [1,2,3]}}
  var marker = {routePointIndex: 101, getPosition: function(){ return{lat: function(){return 123;}, lng: function(){return 456;}}}};
  var heading = 360;
  var relativeAngle = 45;
  var kmFromStart = 12.1;
  var kmFromPrev = 2.5;

  mapModel.getPrevWaypointRoutePointIndex = function(integer, array){return (marker.routePointIndex == integer && array == markers ? 100 : null);};
  mapModel.computeHeading = function(markerObj, routeObj){return (marker == markerObj && route == routeObj ? heading : null)};
  mapModel.computeRelativeAngle = function(markerObj,routeObj,number){return (markerObj == marker && routeObj == route && heading == number ? relativeAngle : null)};
  mapModel.computeDistanceOnRouteBetweenPoints = function(index1,index2, array){return (typeof index1 == "number" && typeof index2 == "number" && JSON.stringify(array) == JSON.stringify(route.getArray()) ? (index1 == 0 ? kmFromStart : kmFromPrev ) : null )};

  var geoData = mapModel.getWaypointGeodata(marker,route,markers);

  assert.equal(geoData.lat, 123, "It sets the geoData obj lat");
  assert.equal(geoData.lng, 456, "It sets the geoData obj lng");
  assert.equal(geoData.routePointIndex, 101, "It sets the geoData obj routePointIndex");
  assert.equal(geoData.distances.kmFromStart, 12.1, "It sets the geoData obj distances kmFromStart");
  assert.equal(geoData.distances.kmFromPrev, 2.5, "It sets the geoData obj distances kmFromPrev");
  assert.equal(geoData.angles.heading, 360, "It sets the geoData obj angles heading");
  assert.equal(geoData.angles.relativeAngle, 45, "It sets the geoData obj angles relativeAngle");

  assert.end();
});
