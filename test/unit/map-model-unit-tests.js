var test = require( 'tape' );
var model = require('../../src/models/map-model.js').mapModel;

test( 'Makes the first point added to the route a instruction', function( assert ) {
  var mapModel = new model();
  var instruction;
  var markers = ["first marker", "second marker"];
  mapModel.addInstruction = function(marker){instruction =  marker;};
  mapModel.makeFirstMarkerInstruction(markers);
  assert.equal(instruction,"first marker", "It makes the first marker in the markers array a instruction")

  assert.end();
} );


test( 'Adds a point to the route by updating the polyline and puting a marker over that vertex on the polyline', function(assert){
  var mapModel = new model();
  var polylineLatLng, markerLatLng, markerMap;
  var testLatLng = {lat: 123, lng: 456};

  mapModel.addLatLngToRouteMvcArray = function(latLng){ polylineLatLng = latLng; };
  mapModel.buildRouteMarker = function(latLng,map){ return {latLng: latLng, map: map}; };
  mapModel.addMarkerToMarkersArray = function(marker){ markerLatLng = marker.latLng; markerMap = marker.map; };

  var marker = mapModel.addRoutePoint(testLatLng,"i'm a map");
  assert.deepEqual(marker, { latLng: { lat: 123, lng: 456 }, map: "i'm a map" }, "It returns a marker")
  assert.deepEqual(testLatLng,polylineLatLng, "It adds the lat lng to the polyline");
  assert.deepEqual(markerLatLng,markerLatLng, "It creates a marker at the correct lat lng");
  assert.equal(markerMap,"i'm a map", "It passes the map to the route marker");

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

test( 'Gets the geodata for a instruction', function(assert){
  var mapModel = new model();
  var markers = [4,5,6];
  var route = {getArray: function(){return [1,2,3]}}
  var marker = {routePointIndex: 101, getPosition: function(){ return{lat: function(){return 123;}, lng: function(){return 456;}}}};
  var heading = 360;
  var relativeAngle = 45;
  var kmFromStart = 12.1;
  var kmFromPrev = 2.5;

  mapModel.getPrevInstructionRoutePointIndex = function(integer, array){return (marker.routePointIndex == integer && array == markers ? 100 : null);};
  mapModel.computeHeading = function(markerObj, routeObj){return (marker == markerObj && route == routeObj ? heading : null)};
  mapModel.computeRelativeAngle = function(markerObj,routeObj,number){return (markerObj == marker && routeObj == route && heading == number ? relativeAngle : null)};
  mapModel.computeDistanceOnRouteBetweenPoints = function(index1,index2, array){return (typeof index1 == "number" && typeof index2 == "number" && JSON.stringify(array) == JSON.stringify(route.getArray()) ? (index1 == 0 ? kmFromStart : kmFromPrev ) : null )};

  var geoData = mapModel.getInstructionGeodata(marker,route,markers);

  assert.equal(geoData.lat, 123, "It sets the geoData obj lat");
  assert.equal(geoData.long, 456, "It sets the geoData obj lng");
  assert.equal(geoData.routePointIndex, 101, "It sets the geoData obj routePointIndex");
  assert.equal(geoData.kmFromStart, 12.1, "It sets the geoData obj distances kmFromStart");
  assert.equal(geoData.kmFromPrev, 2.5, "It sets the geoData obj distances kmFromPrev");
  assert.equal(geoData.heading, 360, "It sets the geoData obj angles heading");
  assert.equal(geoData.relativeAngle, 45, "It sets the geoData obj angles relativeAngle");

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
  mapModel.markers = []
  mapModel.addMarkerToMarkersArray('a marker')
  assert.equal(mapModel.markers[0], 'a marker', "It pushes the marker obj onto the array");
  assert.end();
});

test( 'Adds a instruction marker to the markers array', function(assert){
  var mapModel = new model();
  var callbacksSent=0, geoDataSent,marker={setIcon: function(icon){this.icon = icon;}}
  mapModel.addInstructionToRoadbook = function(geoData,callback){geoDataSent = geoData.amGeoData; callback.call(); return "i am a roadbook instruction"};
  mapModel.getInstructionGeodata = function(){ return {amGeoData: true}};
  mapModel.updateRoadbookAndInstructions = function(){callbacksSent = true ;};
  mapModel.setMarkerIconToInstructionIcon = function(marker){marker.icon = "instruction icon"};

  mapModel.addInstruction(marker);

  assert.equal(marker.icon, 'instruction icon', "It sets the marker icon to a instruction icon");
  assert.equal(marker.instruction, 'i am a roadbook instruction', "It adds a reference to the corresponding roadbook instruction");
  assert.ok(geoDataSent,"It sends geodata to the roadbook for instruction display");
  assert.ok(callbacksSent, "It sends a call back to the roadbook instruction function to update total distance and all instruction geodata");

  assert.end();
});

test( 'Adds a instruction bubble to a marker', function(assert){
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
  var marker = {icon: "instruction icon", setIcon: function(icon){this.icon = icon}};
  mapModel.buildDeleteQueueIcon = function(){return "delete queue icon"};

  mapModel.setMarkerIconToDeleteQueueIcon(marker);

  assert.equal(marker.icon, "delete queue icon", "It sets the marker icon to a delete queue icon");
  assert.end();
});

test( 'Sets a markers icon to a instruction icon', function(assert){
  var mapModel = new model();
  var marker = {icon: "normal icon", setIcon: function(icon){this.icon = icon}};
  mapModel.buildInstructionIcon = function(){return "instruction icon"};

  mapModel.setMarkerIconToInstructionIcon(marker);

  assert.equal(marker.icon, "instruction icon", "It sets the marker icon to a instruction icon");
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
  var marker1 = {icon: "instruction icon", setIcon: function(icon){this.icon = icon},routePointIndex: 11};
  var marker2 = {icon: "instruction icon", setIcon: function(icon){this.icon = icon},routePointIndex: 42};

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

test( 'Can take a beginning and end index and a route array and give the distance between points at the indecies', function(assert){
  var mapModel = new model();
  mapModel.googleMapsComputeDistanceInKM = function(array){
    return array.reduce((a, b) => a + b, 0);
  }
  var route = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  var distance = mapModel.computeDistanceOnRouteBetweenPoints(4,12,route);

  assert.equal(distance, 72, "It constructs an accurate sub-array of points between indecies to send to the google maps API then returns that measurement");
  assert.end();
});

test( 'Can take a marker and a route array and give the heading to the next point on the route', function(assert){
  var mapModel = new model();
  mapModel.googleMapsComputeHeading = function(number1, number2){
    if(number1 < number2){
      return 135
    }
    if(number1 > number2){
      return -45
    }
    return 0;
  };
  var marker = {routePointIndex: 1};
  var route = {getLength: function(){return this.array.length;}, getAt: function(index){return this.array[index];}, array: [11,14,6,20]}
  var heading = mapModel.computeHeading(marker,route);

  assert.equal(heading, 315, "It corrects a heading between two points to be 0-360 if the input heading is negative")

  marker = {routePointIndex: 2};
  heading = mapModel.computeHeading(marker,route);
  assert.equal(heading, 135, "It corrects returns the heading between two points if the input heading is positive")

  marker = {routePointIndex: 3};
  heading = mapModel.computeHeading(marker,route);
  assert.equal(heading, 0, "It returns zero if the marker is the last point in the route")


  marker = {routePointIndex: 0};
  route = {getLength: function(){return this.array.length;}, getAt: function(index){return this.array[index];}, array: [11]}
  heading = mapModel.computeHeading(marker,route);
  assert.equal(heading, 0, "It returns zero if there is only one point in the route")

  assert.end();
});

test( 'Can take a marker and a route array and give the relative angle from the next point on the route', function(assert){
  var mapModel = new model();
  mapModel.googleMapsComputeHeading = function(number1, number2){
    if(number1 < number2){
      return 135
    }
    if(number1 > number2){
      return -45
    }
    return 0;
  };
  var marker = {routePointIndex: 0};
  var route = {getLength: function(){return this.array.length;}, getAt: function(index){return this.array[index];}, array: [11,14,6,20]}
  var relativeAngle = mapModel.computeRelativeAngle(marker, route, 45);
  assert.equal(relativeAngle, 0, "It returns zero if the marker is the first point in the route")

  marker = {routePointIndex: 3};
  relativeAngle = mapModel.computeRelativeAngle(marker, route, 45);
  assert.equal(relativeAngle, 0, "It returns zero if the marker is the last point in the route")

  marker = {routePointIndex: 1};
  relativeAngle = mapModel.computeRelativeAngle(marker, route, 45);
  assert.equal(relativeAngle, -90, "It returns the relative angle if it is between -180 and 180")

  marker = {routePointIndex: 1};
  relativeAngle = mapModel.computeRelativeAngle(marker, route, -140);
  assert.equal(relativeAngle, 85, "It returns and corrects the relative angle to be between -180 and 180 if it is less the -180")

  marker = {routePointIndex: 2};
  relativeAngle = mapModel.computeRelativeAngle(marker, route, 180);
  assert.equal(relativeAngle, -135, "It returns and corrects the relative angle to be between -180 and 180 if it is greater than 180")

  assert.end();
});

test( 'Can determine the index in the route array to insert an edge point at', function(assert){
  var mapModel = new model();
  var latLng = 4;
  var latLngArray = [0,1,2,3,5,6,7,8,9];
  mapModel.getEdgeTolerance = function(map){ return map == "i am a map" ? 2 : null;};
  mapModel.checkIsLocationBetweenPoints = function(startLatLng, endLatLng, checkLatLng, tolerance){
    return (startLatLng < checkLatLng && checkLatLng < endLatLng && tolerance >= 2);
  };

  var index = mapModel.computeInsertionIndex(latLng,latLngArray,"i am a map");
  assert.equal(index, 4, "It returns the correct index between two points in the array")

  mapModel.getEdgeTolerance = function(map){ return map == "i am a map" ? 1 : null;};
  var index = mapModel.computeInsertionIndex(latLng,latLngArray,"i am a map");
  assert.equal(index, 4, "It will increase the tolerance if the index is not found until it returns the correct index between two points in the array")

  assert.end();
});

test( 'Can determine if a point is between two other points', function(assert){
  var mapModel = new model();
  mapModel.googleMapsNewPolyline = function(array){ return array instanceof(Array)};
  mapModel.googleMapsIsLocationOnEdge = function(int1, bool, int2){ return typeof int1 == "number" && bool && typeof int1 == "number"};
  assert.ok(mapModel.checkIsLocationBetweenPoints(1,2,3,4), "it routes the arguemnts correctly to the functions which actually perform the work and returns the result")
  assert.end();
});

test( 'Can turn a instruction back into routepoint', function(assert){
  var mapModel = new model();
  var paramsSent = true;
  mapModel.buildVertexIcon = function(){return "vertex icon"};
  mapModel.deleteWaypointBubble = function(index){paramsSent = paramsSent && index == 12};
  mapModel.deleteInstructionFromRoadbook = function(index){paramsSent = paramsSent && index == 12};
  mapModel.updateRoadbookAndInstructions = function(){paramsSent = paramsSent && true;};
  var marker = {setIcon: function(icon){this.icon = icon}, icon: "instruction icon", routePointIndex: 12, instruction: {id: 12}, bubble: "wpm bubble"}

  mapModel.revertInstructionToRoutePoint(marker);

  assert.equal(marker.instruction, null, "It sets the markers instruction to null");
  assert.equal(marker.instruction, null, "It sets the markers bubble to null");
  assert.ok(paramsSent, "It updates all dependencies with the correct params");
  assert.equal(marker.icon, "vertex icon", "It sets the markers icon to a vertex icon");

  assert.end();
});


test( 'Can delete a point from the route', function(assert){
  var mapModel = new model();
  var paramsSent = true;
  mapModel.decrementRouteVertexIndecies = function(index){paramsSent = paramsSent && index == 6};
  mapModel.route = {removeAt: function(index){this.array.splice(index,1)}, array: [0,1,2,3,4,5,6,7,8,9,10]}
  var marker = {setMap: function(map){this.map = map}, map: "i am a map", routePointIndex: 6}
  mapModel.markers = [0,1,2,3,4,5,marker,7,8,9,10];


  mapModel.deletePointFromRoute(marker.routePointIndex);

  assert.equal(marker.map, null, "It sets the markers map to null");
  assert.equal(mapModel.markers.length, 10, "It removes the marker from the markers array");
  assert.equal(mapModel.route.array.length, 10, "It removes the route point from the route array");
  assert.equal(mapModel.markers[6], 7, "It removes the correct marker from the markers array");
  assert.equal(mapModel.route.array[6], 7, "It removes the correct route point from the route array");

  assert.ok(paramsSent, "It updates all dependencies with the correct params");

  assert.end();
});

test( 'Can delete points between the indecies in the delete queue from the route', function(assert){
  var mapModel = new model();
  mapModel.deleteQueue = [];
  mapModel.markers = []
  mapModel.revertInstructionToRoutePoint = function(marker){};
  mapModel.deletePointFromRoute = function(index){};

  assert.end();
});

test( 'It can decrement all index references in the marker array when given an index to start at', function(assert){
  var mapModel = new model();
  mapModel.markers = [{routePointIndex: 1},
                      {routePointIndex: 2},
                      {routePointIndex: 3},
                      {routePointIndex: 4},
                      {routePointIndex: 5},
                    ];
  mapModel.decrementRouteVertexIndecies(2);
  var result = "";
  for(var i = 0;i < mapModel.markers.length;i++) {
    result += mapModel.markers[i].routePointIndex;
  }
  assert.equal(result, "12234", "It decrements each route index after the given index by one")
  assert.end();
});

test( 'It can increment all index references in the marker array when given an index to start at', function(assert){
  var mapModel = new model();
  mapModel.markers = [{routePointIndex: 1},
                      {routePointIndex: 2},
                      {routePointIndex: 3},
                      {routePointIndex: 4},
                      {routePointIndex: 5},
                    ];
  mapModel.incrementRouteVertexIndecies(2);
  var result = "";
  for(var i = 0;i < mapModel.markers.length;i++) {
    result += mapModel.markers[i].routePointIndex;
  }
  assert.equal(result, "12356", "It increments each route index after the given index by one")
  assert.end();
});

test( 'It can get the edge tolerance for the map at a given zoom', function(assert){
  var mapModel = new model();
  var map = {getZoom: function(){return this.zoom}, zoom: 11};
  var result = mapModel.getEdgeTolerance(map);
  assert.equal(result, 0.005116065460197068, "It returns the edge tolerance for the map at a given zoo")
  assert.end();
});

test( 'It can get the previous instruction in the markers arrays routePointIndex for a given marker', function(assert){
  var mapModel = new model();
  mapModel.markers = [{routePointIndex: 1, instruction: true},
                      {routePointIndex: 2},
                      {routePointIndex: 3, instruction: true},
                      {routePointIndex: 4},
                      {routePointIndex: 5, instruction: true},
                    ];
  var result = mapModel.getPrevInstructionRoutePointIndex(4, mapModel.markers);
  assert.equal(result, 2, "It returns route point index of the previous marker which is  ainstruction in the markers array")
  assert.end();
});

test( 'It can get the instructions bearing to orient the map with', function(assert){
  var mapModel = new model();
  mapModel.route = {getAt: function(index){return this.array[index];}, array: [11,14,6,20]}
  mapModel.getRoadBookInstructionBeingEditedRoutePointIndex = function(){return 2;};
  mapModel.googleMapsComputeHeading = function(num1, num2){ return num1 + num2;};
  var result = mapModel.computeMapOrientationAngle();
  assert.equal(result, 20, "It returns angle to orient the map with")
  assert.end();
});

test( 'It can insert a latLng between points on the route', function(assert){
  var mapModel = new model();
  mapModel.route = {getArray: function(){return this.array;}, array: [11,14,6,20]}
  mapModel.computeInsertionIndex = function(num, array, map){return (typeof num == "number" && map == "a map" && JSON.stringify(array) == "[11,14,6,20]" ? num : null);};
  mapModel.insertLatLngAtIndex = function(num1, num2, map){ return (num1 == num2 && map == "a map");};

  var result = mapModel.insertLatLngIntoRoute(2, "a map");

  assert.ok(result, "It the result of the two child functions given the correct paramters")
  assert.end();
});

test( 'It can insert a latLng into the route at a given index', function(assert){
  var mapModel = new model();
  var incremented;
  mapModel.route = {insertAt: function(index, num){this.array.splice(index,0,num)}, array: [11,14,6,20]}
  mapModel.markers = [11,14,6,20];
  mapModel.buildRouteMarker = function(num, map){return (typeof num == "number" && map == "a map" ? num : null);};
  mapModel.incrementRouteVertexIndecies = function(num){ incremented = (typeof num == "number" ? num : null);};

  var result = mapModel.insertLatLngAtIndex(100, 2, "a map");

  assert.ok(incremented, "It makes a call to increment the indecies of points following the given index")
  assert.equal(JSON.stringify(mapModel.markers), "[11,14,100,6,20]", "It inserts the latLng into the markers array at the given index")
  assert.equal(JSON.stringify(mapModel.route.array), "[11,14,100,6,20]", "It inserts the latLng into the route array at the given index")
  assert.end();
});

test( 'It will update the position of a given maker and the route polyline vertex it covers', function(assert){
  var mapModel = new model();
  mapModel.route = [1,2,3,4,5]
  var marker = {routePointIndex: 2, position: 3};
  mapModel.googleMapsMarkerSetPosition = function(marker, num){marker.position = num};
  mapModel.googleMapsMvcArraySetPositionAtIndex = function(route, index, position){route[index] = position;};

  mapModel.updateMarkerPosition(marker, 10);
  assert.equal(marker.position, 10, "It updates the marker position");
  assert.equal(JSON.stringify(mapModel.route), "[1,2,10,4,5]", "It updates the route polyline");
  assert.end();
});
