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
