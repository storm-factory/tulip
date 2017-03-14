var test = require( 'tape' );
var mapModel = require('../../src/models/map-model.js');
mapModel.route = []
test( 'Makes the first point added to the route a waypoint', function( assert ) {
  mapModel.route = [1];
  mapModel.makeFirstRoutePointWaypoint({});

  assert.equal( notification.mapFileNameToType("speed-end"), "fsz", 'Maps speed-end to fsz' );

  assert.end();
} );
