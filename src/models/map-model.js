'use strict';
/*
  PROBLEM: This class does map stuff... It should be broken into more specific classes
  SOLUTIONS: map-util, map route object, map waypoint object.. something along those lines

  // TODO rewrite latLng as prototype so we can store all the marker stuff in there and only have to track one array

  the model object will have to know about the app and the roadbook. not sure how we want to interface that? maybe route everything through the app?
*/
class MapModel {

  constructor(){
    this.route;
    this.markers=[];
    this.deleteQueue = [];
    this.presenter;
  }

  /*
    takes a response from google maps directions API and appends it to the route
    NOTE needs refactored to be more SOLID and testable
  */
  appendGoogleDirectionsToMap(data,map){
    var steps = data.routes[0].legs[0].steps
    for(var i=0;i<steps.length;i++){
      var stepPoints = this.googleMapsDecodePath(steps[i].polyline.points);
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
        this.addRoutePoint(latLng,map);
        if(j == points.length-1){
          this.addWaypoint(this.getLastItemInArray(this.markers))
        }

      }
    }
    this.updateAllMarkersWaypointGeoData();
    this.this.updateRoadbookTotalDistance();
  }

  /*
    Adds a point to the route array for manangement
    Since the route array is an MVCArray bound to the route path
    the new point will show up on the route Polyline automagically.

    Listeners are bound to the point to allow it to be toggled as a waypoint or to be removed entirely
  */
  addRoutePoint(latLng,map){
    this.addLatLngToRoutePolyline(latLng);
    this.addRoutePointMarker(latLng,map);
    this.updateAllMarkersWaypointGeoData();
    this.updateRoadbookTotalDistance();
  }

  /*
    pushing a latLng into the the route array will automagically add it to the controllers polyline because it is a google MVC array
  */
  addLatLngToRoutePolyline(latLng){
    this.route.push(latLng);
  }

  addRoutePointMarker(latLng,map){
    var marker = this.buildRouteMarker(latLng, map);
    this.makeFirstRoutePointWaypoint(marker, this.addWaypoint);
    this.markers.push(marker);
  }

  addWaypoint(marker){
    marker.setIcon(this.buildWaypointIcon());
    marker.waypoint = app.roadbook.addWaypoint(this.getWaypointGeodata(marker, this.route, this.markers));
    this.updateAllMarkersWaypointGeoData();
    this.updateRoadbookTotalDistance();
  }

  addWaypointBubble(index,radius,fill,map) {
    marker.bubble = this.buildWaypointBubble(radius, this.markers[index].getPosition(), fill, map);
  }

  // TODO this whole process could be more elegant
  addMarkerToDeleteQueue(marker){
    if(this.deleteQueue.length == 0){
      this.deleteQueue.push(marker.routePointIndex);
      marker.setIcon(this.buildDeleteQueueIcon());
    } else {
      this.deleteQueue.push(marker.routePointIndex);
      this.deletePointsBetweenMarkersInQueueFromRoute();
      this.deleteQueue = [];

      this.updateAllMarkersWaypointGeoData();
      this.updateRoadbookTotalDistance();
      // TODO could we have a dynamic presenter property update function?
      this.presenter.markerDeleteMode = false
      this.presenter.displayEdge = true; //we have to set this because the mouse out handler that usually handles this gets nuked in the delete
    }
  }

  computeDistanceOnRouteBetweenPoints(beginIndex, endIndex, routePointsArray){
    var points = [];
    for(var i=beginIndex;i<endIndex+1;i++){
      points.push(routePointsArray[i]);
    }
    return this.googleMapsComputeDistanceInKM(points);
  }

  /*
    Compute the cap heading of this waypoint
  */
  computeHeading(marker, routePoints){
    var pointIndex = marker.routePointIndex;
    var nextPointIndex = pointIndex+1 < routePoints.getLength() ? pointIndex + 1 : pointIndex;

    //the heading is from this point to the next one
    var heading = this.googleMapsComputeHeading(routePoints.getAt(pointIndex), routePoints.getAt(nextPointIndex));
    //google maps headings are between [-180,180] so convert them to a compass bearing
    if(heading < 0){
      heading = 360 + heading;
    }
    return heading;
  }

  /*
    Compute the angle of the turn from the previous heading to this one
  */
  computeRelativeAngle(marker,routePoints,heading){
    var pointIndex = marker.routePointIndex;
    var prevPointIndex = pointIndex-1 > 0 ? pointIndex - 1 : 0;
    var relativeAngle = ((0 == pointIndex) || (routePoints.getLength()-1 == pointIndex)) ? 0 : heading - this.googleMapsComputeHeading(routePoints.getAt(prevPointIndex), routePoints.getAt(pointIndex));
    // we want to limit what we return to being 0 < angle < 180 for right turns and 0 > angle > -180 for left turns
    if(relativeAngle > 180) {
      relativeAngle = -(360 - relativeAngle); //left turn
    } else if ( relativeAngle < -180) {
      relativeAngle = (360 + relativeAngle); //right turn
    }
    return relativeAngle;
  }

  computeRoutePointInsertionIndex(latLng,map){
    /*
      Iterate through the point pairs on the segment
      determine which edge the latLng falls upon
      and insert a new point into route at the index of the edge point
    */
    var idx;

    var tolerance = this.getEdgeTolerance(map); //this could be passed in
    for(var i = 1; i < this.route.length; i++ ){
      // does the event point fit in the bounds of the two reference points before and after the click
      var path = [this.route.getArray()[i-1],this.route.getArray()[i]];
      var line = new google.maps.Polyline({path: path});

      if(this.googleMapsIsLocationOnEdge(latLng, line, tolerance)) {
        idx = i;
        // this.insertRoutePointAtIndex(latLng, i); //TODO have something else do this, just return the index value
        break; //we found it, we're done here
      }
      //we haven't found it, increse the tolerance and start over
      if(i == this.route.length - 1 ){
        tolerance = tolerance*2;
        i = 0;
      }
    }
    return idx;
  }

  deleteWaypoint(marker){
    marker.setIcon(this.buildVertexIcon());
    this.deleteWaypointBubble(marker.routePointIndex);
    app.roadbook.deleteWaypoint(marker.waypoint.id);
    marker.waypoint = null;
    this.updateAllMarkersWaypointGeoData();
    this.updateRoadbookTotalDistance();
  }

  /*
    Removes a route point from the route and decrement the pointIndex of each point on the route after the point being
    removed by one.
  */
  deletePointFromRoute(marker){
    var pointIndex = marker.routePointIndex;
    this.deleteWaypointBubble(pointIndex);
    this.route.removeAt(pointIndex)
    this.markers.splice(pointIndex,1);
    this.decrementRouteVertexIndecies(pointIndex);
    marker.setMap(null);
  }

  deleteWaypointBubble(routePointIndex){
    if(this.markers[routePointIndex].bubble){
      this.markers[routePointIndex].bubble.setMap(null);
    }
  }
  // TODO this whole process could be more elegant
  deletePointsBetweenMarkersInQueueFromRoute(){
    this.deleteQueue.sort(function(a,b){return a - b});
    var start = this.deleteQueue[0];
    var end = this.deleteQueue[1];
    for(var i = end;i >= start;i--){
      if(this.markers[i].waypoint){
        this.deleteWaypoint(this.markers[i]);
      }
      this.deletePointFromRoute(this.markers[i]);
    }
  }

  /*
    decrements the route vertex index of each point along the route after the passed in index
  */
  decrementRouteVertexIndecies(startIndex) {
    for(i = startIndex; i < this.markers.length; i++){
      var point = this.markers[i];
      point.routePointIndex = point.routePointIndex - 1;
    }
  }

  /*
    calculates a tolerance for determining if a location falls on an edge based on map zoom level
  */
  getEdgeTolerance(map){
    return Math.pow(map.getZoom(), -(map.getZoom()/5));
  }

  getWaypointGeodata(marker, route, markers){
    var prevWaypointIndex = this.getPrevWaypointRoutePointIndex(marker.routePointIndex, markers); //TODO pass in markers?
    var heading = this.computeHeading(marker, route);
    var relativeAngle = this.computeRelativeAngle(marker,route,heading);
    return {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      routePointIndex: marker.routePointIndex,
      distances: {
                    kmFromStart: this.computeDistanceOnRouteBetweenPoints(0,marker.routePointIndex, route.getArray()), //TODO pass in route?
                    kmFromPrev: this.computeDistanceOnRouteBetweenPoints(prevWaypointIndex, marker.routePointIndex, route.getArray()) //TODO pass in route?
                  },
      angles: {
        heading: heading,
        relativeAngle: relativeAngle
      }
    }
  }

  getPrevWaypointRoutePointIndex(routePointIndex,markersArray){
    var index = 0;
    for(var i=routePointIndex-1;i>0;i--){
      if(markersArray[i].waypoint){
        index = i;
        break;
      }
    }
    return index;
  }

  getWaypointBearing(){
    var i = app.roadbook.currentlyEditingWaypoint.routePointIndex; //TODO inject this dependency and wrap it in a function
    if(i){
      return this.googleMapsComputeHeading(this.route.getAt(i-1),this.route.getAt(i))
    }
  }

  /*
    increments the route vertex index of each point along the route after the passed in index
  */
  incrementRouteVertexIndecies(startIndex) {
    startIndex++;
    for(i = startIndex; i < this.markers.length; i++){
      var marker = this.markers[i];
      marker.routePointIndex = marker.routePointIndex + 1;
    }
  }

  insertRoutePointBetweenPoints(latLng,map){
    var index = this.computeRoutePointInsertionIndex(latLng,map);
    var marker = this.insertRoutePointAtIndex(latLng,index,map);
    return marker;
  }

  insertRoutePointAtIndex(latLng, index, map){
    this.route.insertAt(index,latLng)
    var marker = this.buildRouteMarker(latLng, map);
    this.markers.splice(index,0,marker);
    this.incrementRouteVertexIndecies(index);
    return marker;
  }

  // TODO make this get geoData like everyone else, NOTE will require modifying those functions
  makeFirstRoutePointWaypoint(marker, callback){
    if(this.route.length == 1) {
      marker.kmFromStart = 0;
      marker.kmFromPrev = 0;
      if(typeof callback === "function"){
        callback.call(this,marker);
      }
    }
  }

  updateAllMarkersWaypointGeoData() {
    for(var i = 0; i < this.markers.length; i++) {
      var marker = this.markers[i];
      if(marker.waypoint) {
        this.updateMarkerWaypointGeoData(marker, this.route, this.markers, this.getWaypointGeodata(marker, route, markers));
      }
    }
  }

  updateMarkerPosition(marker, latLng){
    this.googleMapsMarkerSetPosition(marker,latLng)
    this.googleMapsPolylineSetPositionAtIndex(this.route,marker.routePointIndex, latLng)
  }

  updateMarkerWaypointGeoData(marker, route, markers, geoData){
    marker.waypoint.updateWaypoint(geoData, marker.routePointIndex); //TODO make this a function
  }

  updateRoadbookTotalDistance(){
    app.roadbook.updateTotalDistance(); //NOTE this shouldn't be in this model
  }

  /*
    Make an API request to google and get the autorouted path between the last point in the route
    and the lat long of the click event passed from the controller
  */
  requestGoogleDirections(latLng,map,callback){
    var _this = this;
    $.get(this.buildDirectionsRequestURL(this.getLastItemInArray(this.route.getArray()),latLng,api_keys.google_directions),function(data){
      if(data.status == "OK"){
        callback.call(_this,data,map);
      }
    });
  }

  /*
    utility methods
  */

  getLastItemInArray(array){
    return array.slice(-1).pop();
  }

  /*
    TODO move the below into a static google maps service/interface class or maybe leave it here...
  */

  buildDirectionsRequestURL(origin,destination,direction_api_key){
    return "https://maps.googleapis.com/maps/api/directions/json?"
              + "origin="+origin.lat()+","+ origin.lng()
              + "&destination=" + destination.lat()+","+ destination.lng()
              + "&key=" + direction_api_key
  }

  /*
    an icon which marks a normal point (vertex) on the route Polyline
  */
  buildVertexIcon(){
    return {
              path: 'M-1,-1 1,-1 1,1 -1,1z',
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ffba29',
              fillColor: '#787878',
              fillOpacity: 1
            };
  }

  /*
    an icon which marks a waypoint (vertex) on the route Polyline
  */
  buildWaypointIcon(){
    return {
              path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ff9000',
              fillColor: '#ff4200',
              fillOpacity: 1
            };
  }

  /*
    an icon which marks a waypoint (vertex) on the route Polyline
  */
  buildDeleteQueueIcon(){
    return {
              path: 'M-1.25,-1.25 1.25,-1.25 1.25,1.25 -1.25,1.25z',
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ff4200',
              fillColor: '#ff9000',
              fillOpacity: 1
            };
  }

  buildRouteMarker(latLng, map){
    var marker = new google.maps.Marker({
                      icon: this.buildVertexIcon(),
                      map: map,
                      position: latLng,
                      draggable: true,
                      routePointIndex: this.route.length > 0 ? this.route.indexOf(latLng) : 0,
                    });
    this.presenter.bindToMapMarker(marker);
    return marker;
  }

  buildHandleMarker(latLng,map){
    return new google.maps.Marker({
                            icon: this.buildVertexIcon(),
                            map: map,
                            position: latLng,
                            draggable: true,
                            zIndex: -1,
                          });
  }

  buildWaypointBubble(radius,center,fill,map){
    return new google.maps.Circle({
            strokeColor: fill,
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: fill,
            fillOpacity: 0.2,
            clickable: false,
            map: map,
            center: center,
            radius: Number(radius)
          });
  }

  googleMapsDecodePath(points){
    return google.maps.geometry.encoding.decodePath(points);
  }

  googleMapsComputeHeading(a,b){
    return google.maps.geometry.spherical.computeHeading(a, b);
  }

  googleMapsComputeDistanceInKM(pointsArray){
    return google.maps.geometry.spherical.computeLength(pointsArray)/1000;
  }

  googleMapsIsLocationOnEdge(latLng, line, tolerance){
    return google.maps.geometry.poly.isLocationOnEdge(latLng, line, tolerance);
  }

  googleMapsMarkerSetPosition(marker,latLng){
    marker.setPosition(latLng);
  }

  googleMapsMvcArraySetPositionAtIndex(mvcArray,index,latLng){
    mvcArray.setAt(marker.routePointIndex, latLng);
  }

};


/*
  Node exports for test suite
*/
module.exports.mapModel = MapModel;
