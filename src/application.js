/*
  Define the application namespace
*/
var app = {};
var wpt;
var wpt1;
var roadbook;
$(document).ready(function(){
  mapEditor = new MapEditor();
  roadbook = new Roadbook();
  wpt = new Waypoint({totalDistance: 10, relativeDistance: 3, notes: 'here is some stuff'});
  wpt1 = new Waypoint({totalDistance: 11, relativeDistance: 1, notes: 'here is some more stuff'});
  roadbook.addWaypoint(wpt);
  roadbook.addWaypoint(wpt1);



});
