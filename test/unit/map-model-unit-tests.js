var test = require( 'tape' );
var model = require('../../src/models/map-model.js').mapModel;

test( 'Makes the first point added to the route a waypoint', function( assert ) {
  var mapModel = new model();
  var waypoint;
  mapModel.route = [];
  mapModel.makeFirstMarkerWaypoint({}, function(marker){waypoint = marker;});
  assert.equal(waypoint, undefined, "Does not run the callback if there are no points in the route")

  mapModel.route.push(1);
  mapModel.makeFirstMarkerWaypoint({}, "not a function");
  assert.equal(waypoint, undefined, "Does not run the callback if it is not a function")

  mapModel.makeFirstMarkerWaypoint({}, function(marker){waypoint = marker;});

  assert.ok( waypoint, 'Runs the callback if it is a function and there are points in the route' );
  assert.equal(waypoint.kmFromStart, 0, 'Sets the distance from start to 0');
  assert.equal(waypoint.kmFromPrev, 0, 'Sets the distance from previous waypoint to 0');

  assert.end();
} );


test( 'Adds a point to the route by updating the polyline and puting a marker over that vertex on the polyline', function(assert){
  var mapModel = new model();
  var polylineLatLng, markerLatLng, markerMap, updatedMarkers, updatedRoadbook;
  var testLatLng = {lat: 123, lng: 456};

  mapModel.addLatLngToRouteMvcArray = function(latLng){ polylineLatLng = latLng; };
  mapModel.buildRouteMarker = function(latLng,map){ return {latLng: latLng, map: map}; };
  mapModel.addMarkerToMarkersArray = function(marker){ markerLatLng = marker.latLng; markerMap = marker.map; };
  mapModel.updateAllMarkersWaypointGeoData = function(){updatedMarkers = true;}
  mapModel.updateRoadbookTotalDistance = function(){updatedRoadbook = true;}

  mapModel.addRoutePoint(testLatLng,"i'm a map");

  assert.deepEqual(testLatLng,polylineLatLng, "It adds the lat lng to the polyline");
  assert.deepEqual(markerLatLng,markerLatLng, "It creates a marker at the correct lat lng");
  assert.equal(markerMap,"i'm a map", "It passes the map to the route marker");
  assert.ok(updatedMarkers,"i updated all the marker's waypoint geodata");
  assert.ok(updatedRoadbook,"i updated all the roadbook total distance even though thats not my job");

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

test( 'Pushes a latLng on to the route MVC array', function(assert){
  var mapModel = new model();
  mapModel.route = []
  mapModel.addLatLngToRouteMvcArray('a lat lng')
  assert.equal(mapModel.route[0], 'a lat lng', "It pushes the latLng obj onto the array");
  assert.end();
});

test( 'Adds a route marker to the markers array', function(assert){
  var mapModel = new model();
  var sentMarker, sentCallback;
  mapModel.markers = []
  mapModel.makeFirstMarkerWaypoint = function(marker, callback){sentMarker = (marker == 'a marker'); sentCallback = callback()};
  mapModel.addWaypoint = function(){ return true };

  mapModel.addMarkerToMarkersArray('a marker')

  assert.equal(mapModel.markers[0], 'a marker', "It pushes the marker obj onto the array");
  assert.ok(sentMarker, "It sends the marker to be checked if it is the first marker");
  assert.ok(sentCallback, "It sends a callback to be executed if marker is the first marker");

  assert.end();
});

test( 'Adds a route marker to the markers array', function(assert){
  var mapModel = new model();
  var callbacksSent=0, geoDataSent,marker={setIcon: function(icon){this.icon = icon;}}
  mapModel.addWaypointToRoadbook = function(geoData,callback1,callback2){geoDataSent = geoData.amGeoData; callback1.call(); callback2.call(); return "i am a roadbook waypoint"};
  mapModel.getWaypointGeodata = function(){ return {amGeoData: true}};
  mapModel.updateAllMarkersWaypointGeoData = function(){callbacksSent += 1;};
  mapModel.updateRoadbookTotalDistance = function(){callbacksSent += 1;};
  mapModel.buildWaypointIcon = function(){return "waypoint icon"};

  mapModel.addWaypoint(marker);

  assert.equal(marker.icon, 'waypoint icon', "It sets the marker icon to a waypoint icon");
  assert.equal(marker.waypoint, 'i am a roadbook waypoint', "It adds a reference to the corresponding roadbook waypoint");
  assert.ok(geoDataSent,"It sends geodata to the roadbook for waypoint display");
  assert.equal(callbacksSent, 2, "It sends two call backs to the roadbook waypoint function to update total distance and all waypoint geodata");

  assert.end();
});

test( 'Adds a waypoint bubble to a marker', function(assert){
  var mapModel = new model();
  mapModel.buildWaypointBubble = function(radius,latLng,fill,map){
    return {radius: radius, latLng: latLng, fill: fill, map: map};
  };
  mapModel.markers = [
    {bubble: null, getPosition: function(){return {lat: 321, lng: 654}}},
    {bubble: null, getPosition: function(){return {lat: 789, lng: 987}}},
    {bubble: null, getPosition: function(){return {lat: 123, lng: 456}}},
  ];

  mapModel.addWaypointBubble(2, 400, "blue", "map of narnia");

  var marker = mapModel.markers[2];
  assert.ok(marker.bubble, "It creates a bubble and gives its reference to the marker");
  assert.equal(marker.bubble.radius, 400, "It sets the marker bubble radius");
  assert.deepEqual(marker.bubble.latLng, {lat: 123, lng: 456}, "It sets the marker bubble position");
  assert.equal(marker.bubble.fill, "blue", "It sets the marker bubble fill color");
  assert.equal(marker.bubble.map, "map of narnia", "It sets the marker bubble map");

  assert.end();
});

test( 'Adds a markers route index to the delete queue', function(assert){
  var mapModel = new model();
  mapModel.deleteQueue = [];
  var marker = {routePointIndex: 11};

  mapModel.addMarkerIndexToDeleteQueue(marker.routePointIndex);

  assert.equal(mapModel.deleteQueue[0], 11, "It adds the marker index to the delete queue");
  assert.end();
});


test( 'Sets a markers icon to a delete queue icon', function(assert){
  var mapModel = new model();
  var marker = {icon: "waypoint icon", setIcon: function(icon){this.icon = icon}};
  mapModel.buildDeleteQueueIcon = function(){return "delete queue icon"};

  mapModel.setMarkerIconToDeleteQueueIcon(marker);

  assert.equal(marker.icon, "delete queue icon", "It sets the marker icon to a delete queue icon");
  assert.end();
});

test( 'Adds a marker index to the delete queue if it is empty otherwise deletes all the markers between indecies in queue from the route', function(assert){
  var mapModel = new model();
  mapModel.deleteQueue = [];
  mapModel.setMarkerIconToDeleteQueueIcon = function(marker){marker.icon = 'delete queue icon'};
  var end, start;
  mapModel.deletePointsBetweenMarkersInQueueFromRoute = function(){
    end = mapModel.deleteQueue.pop();
    start = mapModel.deleteQueue.pop();
  }
  var marker1 = {icon: "waypoint icon", setIcon: function(icon){this.icon = icon},routePointIndex: 11};
  var marker2 = {icon: "waypoint icon", setIcon: function(icon){this.icon = icon},routePointIndex: 42};

  var callback1Sent,callback2Sent;
  var callback1 = function(){callback1Sent=true;};
  var callback2 = function(){callback2Sent=true;};

  mapModel.processMarkerForDeletion(marker1, callback1, callback2);
  assert.ok(!callback1Sent, "callback1 doesn't run with when a marker is sent to an empty queue");
  assert.ok(!callback2Sent, "callback2 doesn't run with when a marker is sent to an empty queue");
  assert.equal(mapModel.deleteQueue[0], marker1.routePointIndex, "Inserts the marker's route point index into the queue");

  mapModel.processMarkerForDeletion(marker2, callback1, callback2);
  assert.ok(callback1Sent, "callback1 runs when a marker is sent to a queue with an index already in it");
  assert.ok(callback2Sent, "callback2 runs when a marker is sent to a queue with an index already in it");
  assert.equal(start, 11, "starts deletion at the correct index");
  assert.equal(end, 42, "ends deletion at the correct index");
  assert.equal(mapModel.deleteQueue.length, 0, "Empties the delete queue when a second index is added");

  assert.end();
});
