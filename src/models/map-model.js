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
    this.controller;
  }

  /*
    takes a response from google maps directions API and appends it to the route
    NOTE needs refactored to be more SOLID and testable
  */
  appendGoogleDirectionsToMap(steps,map){
    for(var i=0;i<steps.length;i++){
      var stepPoints = this.googleMapsDecodePath(steps[i].polyline.points);
      var points = this.simplifyDouglasPeucker(stepPoints);

      for (var j=1;j<points.length;j++){
        var latLng = this.googleMapsNewLatLng(points[j].lat, points[j].lng)
        this.addRoutePoint(latLng,map);
        if(j == points.length-1){
          this.addWaypoint(this.getLastItemInArray(this.markers))
        }
      }
    }
    this.updateRoadbookAndWaypoints();
  }

  /*
    Adds a point to the route array for manangement
    Since the route array is an MVCArray bound to the route path
    the new point will show up on the route Polyline automagically.

    Also creates a marker and overlays it on the route at that point
  */
  addRoutePoint(latLng,map){
    // TODO could we alter the latLng prototype here?
    this.addLatLngToRouteMvcArray(latLng);
    var marker = this.buildRouteMarker(latLng, map)
    this.addMarkerToMarkersArray(marker);
    return marker;
  }

  /*
    pushing a latLng into the the route array will automagically add it to the controllers polyline because it is a google MVC array
  */
  addLatLngToRouteMvcArray(latLng){
    this.route.push(latLng);
  }

  addMarkerToMarkersArray(marker){
    this.markers.push(marker);
  }

  addWaypoint(marker){
    this.setMarkerIconToWaypointIcon(marker);
    marker.waypoint = this.addWaypointToRoadbook(this.getWaypointGeodata(marker, this.route, this.markers),this.updateRoadbookAndWaypoints);
  }

  addWaypointBubble(index,radius,fill,map) {
    this.markers[index].bubble = this.buildWaypointBubble(radius, this.markers[index].getPosition(), fill, map);
  }

  // TODO this whole process could be more elegant
  processMarkerForDeletion(marker,callback1,callback2){
    if(this.deleteQueue.length == 0){
      this.addMarkerIndexToDeleteQueue(marker.routePointIndex);
      this.setMarkerIconToDeleteQueueIcon(marker);
    } else {
      this.addMarkerIndexToDeleteQueue(marker.routePointIndex);
      this.deletePointsBetweenMarkersInQueueFromRoute();
      callback1.call(this);
      callback2.call(this);
    }
  }

  addMarkerIndexToDeleteQueue(index){
    this.deleteQueue.push(index);
  }

  setMarkerIconToDeleteQueueIcon(marker){
    marker.setIcon(this.buildDeleteQueueIcon());
  }

  setMarkerIconToWaypointIcon(marker){
    marker.setIcon(this.buildWaypointIcon());
  }

  computeDistanceOnRouteBetweenPoints(beginIndex, endIndex, route){
    var points = [];
    for(var i=beginIndex;i<endIndex+1;i++){
      points.push(route[i]);
    }
    return this.googleMapsComputeDistanceInKM(points);
  }

  /*
    Compute the cap heading of this waypoint
    // TODO doing too many tings
  */
  computeHeading(marker, route){
    var pointIndex = marker.routePointIndex;
    var nextPointIndex = pointIndex+1 < route.getLength() ? pointIndex + 1 : pointIndex;

    //the heading is from this point to the next one
    var heading = this.googleMapsComputeHeading(route.getAt(pointIndex), route.getAt(nextPointIndex));
    //google maps headings are between [-180,180] so convert them to a compass bearing
    if(heading < 0){
      heading = 360 + heading;
    }
    return heading;
  }

  /*
    Compute the angle of the turn from the previous heading to this one
    // TODO doing too many tings
  */
  computeRelativeAngle(marker,route,heading){
    var pointIndex = marker.routePointIndex;
    var prevPointIndex = pointIndex-1 > 0 ? pointIndex - 1 : 0;
    var relativeAngle = ((0 == pointIndex) || (route.getLength()-1 == pointIndex)) ? 0 : heading - this.googleMapsComputeHeading(route.getAt(prevPointIndex), route.getAt(pointIndex));
    // we want to limit what we return to being 0 < angle < 180 for right turns and 0 > angle > -180 for left turns
    if(relativeAngle > 180) {
      relativeAngle = -(360 - relativeAngle); //left turn
    } else if ( relativeAngle < -180) {
      relativeAngle = (360 + relativeAngle); //right turn
    }
    return relativeAngle;
  }

  computeMapOrientationAngle(){
    var i = this.getRoadBookWaypointBeingEditedRoutePointIndex();
    if(i){
      return this.googleMapsComputeHeading(this.route.getAt(i-1),this.route.getAt(i))
    }
  }

  /*
    Iterate through the point pairs on the segment
    determine which edge the latLng falls upon
    and insert a new point into route at the index of the edge point
  */
  computeInsertionIndex(latLng,latLngArray,map){
    var tolerance = this.getEdgeTolerance(map); //this could be passed in
    for(var i = 1; i < latLngArray.length; i++ ){
      if(this.checkIsLocationBetweenPoints(latLngArray[i-1], latLngArray[i], latLng, tolerance)) {
        return i;
      }
      //we haven't found it, increse the tolerance and start over
      if(i == latLngArray.length - 1 ){
        tolerance = tolerance*2;
        i = 0;
      }
    }
  }

  checkIsLocationBetweenPoints(startLatLng, endLatLng, checkLatLng, tolerance){
    var polyline = this.googleMapsNewPolyline([startLatLng,endLatLng]);
    return this.googleMapsIsLocationOnEdge(checkLatLng, polyline, tolerance)
  }

  /*
    Removes a route point from the route and decrement the pointIndex of each point on the route after the point being
    removed by one.
  */
  deletePointFromRoute(index){
    this.route.removeAt(index)
    this.markers.splice(index,1)[0].setMap(null);
    this.decrementRouteVertexIndecies(index);
  }

  deleteWaypointBubble(routePointIndex){
    if(this.markers[routePointIndex].bubble){
      this.markers[routePointIndex].bubble.setMap(null);
    }
  }
  // TODO this whole process could be more elegant
  deletePointsBetweenMarkersInQueueFromRoute(){
    this.deleteQueue.sort(function(a,b){return a - b});
    var end = this.deleteQueue.pop();
    var start = this.deleteQueue.pop();

    for(var i = end;i >= start;i--){
      if(this.markers[i].waypoint){
        this.revertWaypointToRoutePoint(this.markers[i]);
      }
      this.deletePointFromRoute(this.markers[i].routePointIndex);
    }
  }

  /*
    decrements the route vertex index of each point along the route after the passed in index
  */
  decrementRouteVertexIndecies(startIndex) {
    for(var i = startIndex; i < this.markers.length; i++){
      var marker = this.markers[i];
      marker.routePointIndex = marker.routePointIndex - 1;
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
      kmFromStart: this.computeDistanceOnRouteBetweenPoints(0,marker.routePointIndex, route.getArray()), //TODO pass in route?
      kmFromPrev: this.computeDistanceOnRouteBetweenPoints(prevWaypointIndex, marker.routePointIndex, route.getArray()), //TODO pass in route?
      heading: heading,
      relativeAngle: relativeAngle
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

  /*
    increments the route vertex index of each point along the route after the passed in index
  */
  incrementRouteVertexIndecies(startIndex) {
    startIndex++;
    for(var i = startIndex; i < this.markers.length; i++){
      var marker = this.markers[i];
      marker.routePointIndex = marker.routePointIndex + 1;
    }
  }

  insertLatLngIntoRoute(latLng,map){
    var index = this.computeInsertionIndex(latLng,this.route.getArray(),map);
    var marker = this.insertLatLngAtIndex(latLng,index,map);
    return marker;
  }

  insertLatLngAtIndex(latLng, index, map){
    this.route.insertAt(index,latLng)
    var marker = this.buildRouteMarker(latLng, map);
    this.markers.splice(index,0,marker);
    this.incrementRouteVertexIndecies(index);
    return marker;
  }

  makeFirstMarkerWaypoint(markers){
    var marker = markers[0];
    this.addWaypoint(marker);
  }

  revertWaypointToRoutePoint(marker){
    marker.setIcon(this.buildVertexIcon());
    this.deleteWaypointBubble(marker.routePointIndex);
    this.deleteWaypointFromRoadbook(marker.waypoint.id);
    marker.waypoint = null;
    marker.bubble = null;
    this.updateRoadbookAndWaypoints()
  }

  updateAllMarkersWaypointGeoData() {
    for(var i = 0; i < this.markers.length; i++) {
      var marker = this.markers[i];
      if(marker.waypoint) {
        this.updateMarkerWaypointGeoData(marker, this.getWaypointGeodata(marker, this.route, this.markers));
      }
    }
  }

  updateMarkerPosition(marker, latLng){
    this.googleMapsMarkerSetPosition(marker,latLng)
    this.googleMapsMvcArraySetPositionAtIndex(this.route,marker.routePointIndex, latLng)
  }

  /*
    controller interface
  */
  exitControllerDeleteMode(){
    this.controller.exitDeleteMode();
  }

  /*
    Roadbook/Waypoint update catchall
  */
  updateRoadbookAndWaypoints(){
    this.updateAllMarkersWaypointGeoData();
    this.updateRoadbookTotalDistance();
  }

  /*
    Roadbook functions
  */

  updateRoadbookTotalDistance(){
    app.roadbook.updateTotalDistance(); //NOTE this shouldn't be in this model
  }

  addWaypointToRoadbook(geoDataJSON, callback){
    var roadbookWaypoint = app.roadbook.addWaypoint(geoDataJSON);
    callback.call(this)
    return roadbookWaypoint;
  }

  deleteWaypointFromRoadbook(wptIndex){
    app.roadbook.deleteWaypoint(wptIndex);
  }

  getRoadBookWaypointBeingEditedRoutePointIndex(){
    return app.roadbook.currentlyEditingWaypoint.routePointIndex;
  }

  /*
    Waypoint functions
  */

  updateMarkerWaypointGeoData(marker, geoData){
    marker.waypoint.updateWaypoint(geoData, marker.routePointIndex);
  }

  /*
    Make an API request to google and get the autorouted path between the last point in the route
    and the lat long of the click event passed from the controller
  */
  requestGoogleDirections(latLng,map,callback){
    var _this = this;
    $.get(this.buildDirectionsRequestURL(this.getLastItemInArray(this.route.getArray()),latLng,api_keys.google_directions),function(data){
      if(data.status == "OK"){
        callback.call(_this,data.routes[0].legs[0].steps,map);
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
    this.controller.bindToMapMarker(marker);
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
    mvcArray.setAt(index, latLng);
  }

  googleMapsNewPolyline(pointsArray){
    return new google.maps.Polyline({path: pointsArray});
  }

  googleMapsNewLatLng(lat,lng){
    return new google.maps.LatLng(lat, lng);
  }

  /*
    Simplify
  */

  simplifyDouglasPeucker(steps){
    // TODO modify IO module and Simplify lib to use GM latLng object and we can get rid of this loop
    var latLngs = []
    for(var k=0;k<steps.length;k++){
      var latLng = {lat: steps[k].lat(), lng: steps[k].lng()}
      latLngs.push(latLng);
    }
    var simplify = new Simplify();
    return simplify.simplifyDouglasPeucker(latLngs, 7e-9);
  }

};

/*
  Node exports for test suite
*/
module.exports.mapModel = MapModel;
