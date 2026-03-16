'use strict';
/*
  The problem is google maps performance becomes a major issue once there are more than about 5000 markers on the map.
  Loading past 15000 markers from a GPX file makes the app almost unuseable.
  This module alleviates that by implmenting viewport rendering of the markers on the map.
  At lower zoom levels only waypoint markers will be rendered
  At higher zoom levels only point and waypoint markers within the viewport will be rendered
*/
class MapOptimizer {

  bindToMap(map, markers) {
    var _this = this;
    google.maps.event.addListener(map, 'idle', function () { _this.showMarkers(map, markers) });
  }

  showMarkers(map, markers) {
    if (map.getZoom() >= 14) {
      this.showMarkersInViewport(map, markers, map.getBounds());
    } else {
      this.showOnlyInstructionsAtZoom(map, markers);
    }
  }

  showMarkersInViewport(map, markers, bounds) {
    for (var i = 0; i < markers.length; i++) {
      if (bounds.contains(markers[i].getPosition())) {
        if (markers[i].getMap() == null) {
          markers[i].setMap(map);
        }
      } else {
        markers[i].setMap(null);
      }
    }
  }

  showOnlyInstructionsAtZoom(map, markers) {
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].instruction) {
        if (markers[i].getMap() == null) {
          markers[i].setMap(map);
        }
      } else {
        markers[i].setMap(null);
      }
    }
  }

}
/*
  Node exports for test suite
*/
if (typeof window == 'undefined') {
  module.exports.optimizer = MapOptimizer;
}
