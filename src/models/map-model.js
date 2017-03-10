/*
  PROBLEM: This class does map stuff... It should be broken into more specific classes
  SOLUTIONS: map-util, map route object, map waypoint object.. something along those lines

  // TODO is it possible to extract all UI elements to the controller and have this just maintain state and perform computations?
  move markers and polyline to controller along with listener
  explore moving route points to the controller as it mainly is for the polyline
  keep route markers here as that is the roadbook state but maybe rename it

  the model object will have to know about the app and the roadbook. not sure how we want to interface that? maybe route everything through the app?
*/
var MapModel = Class({

  create: function(){
    this.route;
    this.markers;
    this.presenter;
  },

  getWaypointGeodata: function(marker){
    var prevWaypointIndex = this.getPrevWaypointRoutePointIndex(marker.routePointIndex,this.markers);
    var heading = this.computeHeading(marker, this.route);
    return {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      routePointIndex: marker.routePointIndex,
      distances: {
                    kmFromStart: this.computeDistanceBetweenPoints(0,marker.routePointIndex),
                    kmFromPrev: this.computeDistanceBetweenPoints(prevWaypointIndex,marker.routePointIndex)
                  },
      angles: {
        heading: heading,
        relativeAngle: this.computeRelativeAngle(marker,this.route,heading)
      }

    }
  },

  getPrevWaypointRoutePointIndex: function(routePointIndex,markersArray){
    var index = 0;
    for(var i=routePointIndex-1;i>0;i--){
      if(markersArray[i].waypoint){
        index = i;
        break;
      }
    }
    return index;
  },

  /*
    Make an API request to google and get the autorouted path between the last point in the route
    and the lat long of the click event passed from the controller
  */
  getGoogleDirections: function(latLng){
    var _this = this;
    var startSnap = this.route.getArray().slice(-1).pop();
    var endSnap = latLng;
    var url = "https://maps.googleapis.com/maps/api/directions/json?"
                + "origin="+startSnap.lat()+","
                + startSnap.lng()
                + "&destination=" + endSnap.lat()+","
                + endSnap.lng()
                + "&key=" + api_keys.google_directions
    $.get(url,function(data){
      if(data.status == "OK"){
        _this.appendGoogleDirectionsToMap(data);
      }
    });
  },


  /*
    takes a response from google maps directions API and appends it to the route
    NOTE needs refactored to be more SOLID and testable
  */
  appendGoogleDirectionsToMap: function(data){
    var steps = data.routes[0].legs[0].steps
    for(var i=0;i<steps.length;i++){
      var stepPoints = google.maps.geometry.encoding.decodePath(steps[i].polyline.points);
      // NOTE if we change the simplified lib and also the io module to just use google maps LatLng objects instead of literals we could skip this.
      var points = []
      for(var k=0;k<stepPoints.length;k++){
        var point = {lat: stepPoints[k].lat(), lng: stepPoints[k].lng()}
        points.push(point);
      }
      var simplify = new Simplify();
      points = simplify.simplifyDouglasPeucker(points, 7e-9);

      for (var j=1;j<points.length;j++){
        var latLng = new google.maps.LatLng(points[j].lat, points[j].lng);
        var marker = this.presenter.pushRoutePoint(latLng); //NOTE move to presenter
        if(j == points.length-1){
          // TODO how can we abstract this?
          marker.waypoint = app.roadbook.addWaypoint(this.presenter.addWaypoint(marker));
        }

      }
    }
    this.updateRoute();
  },

  deleteWaypoint: function(marker){
    //remove the waypoint from the roadbook
    app.roadbook.deleteWaypoint(marker.waypoint.id);
  },

  // NOTE this can stay
  computeDistanceBetweenPoints: function(beginMarkerRoutePointIndex, endMarkerRoutePointIndex){
    var routePoints = this.route.getArray();
    var points = [];
    for(var i=beginMarkerRoutePointIndex;i<endMarkerRoutePointIndex+1;i++){
      points.push(routePoints[i]);
    }
    //do some conversions and return the results
    return google.maps.geometry.spherical.computeLength(points)/1000;
  },

  /*
    Compute the cap heading of this waypoint
  */
  computeHeading: function(marker, routePoints){
    var pointIndex = marker.routePointIndex;
    var nextPointIndex = pointIndex+1 < routePoints.getLength() ? pointIndex + 1 : pointIndex;

    //the heading is from this point to the next one
    var heading = google.maps.geometry.spherical.computeHeading(routePoints.getAt(pointIndex), routePoints.getAt(nextPointIndex));
    //google maps headings are between [-180,180] so convert them to a compass bearing
    if(heading < 0){
      heading = 360 + heading;
    }
    return heading;
  },

  /*
    Compute the angle of the turn from the previous heading to this one
  */
  computeRelativeAngle: function(marker,routePoints,heading){
    var pointIndex = marker.routePointIndex;
    var prevPointIndex = pointIndex-1 > 0 ? pointIndex - 1 : 0;
    var relativeAngle = ((0 == pointIndex) || (routePoints.getLength()-1 == pointIndex)) ? 0 : heading - google.maps.geometry.spherical.computeHeading(routePoints.getAt(prevPointIndex), routePoints.getAt(pointIndex));
    // we want to limit what we return to being 0 < angle < 180 for right turns and 0 > angle > -180 for left turns
    if(relativeAngle > 180) {
      relativeAngle = -(360 - relativeAngle); //left turn
    } else if ( relativeAngle < -180) {
      relativeAngle = (360 + relativeAngle); //right turn
    }
    return relativeAngle;
  },

  /*
    increments the route vertex index of each point along the route after the passed in index
  */
  incrementRouteVertexIndecies: function(startIndex) {
    startIndex++;
    for(i = startIndex; i < this.markers.length; i++){
      var marker = this.markers[i];
      marker.routePointIndex = marker.routePointIndex + 1;
    }
  },

  /*
    decrements the route vertex index of each point along the route after the passed in index
  */
  decrementRouteVertexIndecies: function(startIndex) {
    for(i = startIndex; i < this.markers.length; i++){
      var point = this.markers[i];
      point.routePointIndex = point.routePointIndex - 1;
    }
  },

  getWaypointBearing: function(){
    var i = app.roadbook.currentlyEditingWaypoint.routePointIndex; //TODO how to abstract this
    if(i){
      return google.maps.geometry.spherical.computeHeading(this.route.getAt(i-1), this.route.getAt(i)); //TODO get this from the model
    }
  },

  updateRoute: function() {
    for(var i = 0; i < this.markers.length; i++) {
      var marker = this.markers[i];
      if(this.markers[i].waypoint) {
        var geoData = this.getWaypointGeodata(marker);
        marker.waypoint.updateWaypoint(geoData, marker.routePointIndex);
      }
    }
    app.roadbook.updateTotalDistance();
  },
});
