var test = require( 'tape' );
var mapOptimizer = require('../../src/modules/map-viewport-optimizer.js').optimizer;

test( 'Sets the map for in bound markers and removes it for out of bound markers', function( assert ) {
  var optimizer = new mapOptimizer();
  var map = "I am map";
  var markers = [
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, getPosition: function(){return 2}, map: map},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, getPosition: function(){return 3}, map: null},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, getPosition: function(){return 2}, map: map},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, getPosition: function(){return 7}, map: map},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, getPosition: function(){return 9}, map: map},
  ]
  var bounds = {contains: function(position){return position < 5}};

  optimizer.showMarkersInViewport(map, markers, bounds);
  assert.equal(markers[3].map, null, "It sets the map to null for markers out of bounds");
  assert.equal(markers[1].map, map, "It sets the map for markers in bounds");

  assert.end();
} );

test( 'Shows only waypoints at low zoom levels', function( assert ) {
  var optimizer = new mapOptimizer();
  var map = "I am map";
  var markers = [
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, waypoint: true, map: map},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, waypoint: false, map: map},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, waypoint: false, map: map},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, waypoint: false, map: map},
    {getMap: function(){return this.map}, setMap: function(map){return this.map = map;}, waypoint: true, map: map},
  ]
  var bounds = {contains: function(position){return position < 5}};

  optimizer.showOnlyWaypointsAtZoom(map, markers);
  assert.equal(markers[3].map, null, "It sets the map to null for normal markers at low zooms");
  assert.equal(markers[0].map, map, "It sets the map for waypoint markers at low zooms");

  assert.end();
} );
