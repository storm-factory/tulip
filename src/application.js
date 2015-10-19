/*
  Define the application namespace
*/
var app = {};

$(document).ready(function(){
  var wpt = new Waypoint({totalDistance: 10, relativeDistance: 3, notes: 'here is some stuff'});
  riot.mount('waypoint',wpt);
});
