this.addWaypoint/*
  A module for providing the application with the means to control the map via the UI
*/
class MapPresenter{

  constructor(model){
    this.model = model;
    this.rotation = 0;
    this.lockedBeforeWaypointEdit = false;
    this.mapUnlocked = true; //this guy isn't working right, and is also a little jenky
    this.displayEdge = true; //displayEdge is a instance variable which tracks whether a handle should be shown when the user hovers the mouse over the route. (think of a better name and nuke this comment)
    this.markerDeleteMode = false;
    this.routeMarkers = [];
    this.deleteQueue = [];
    this.dialog = require('electron').remote.dialog;

    this.initMap();
    this.initRoutePolyline();
    this.attemptGeolocation();

    this.bindToModel();
    this.bindToUI();
    this.bindToMapSurface();
    this.bindToMapPolyline();
  }

  initMap(){
    this.map = new google.maps.Map(document.getElementById('map'), {
       center: {lat: 36.068209, lng: -105.629669},
       zoom: 4,
       disableDefaultUI: true,
       mapTypeId: google.maps.MapTypeId.HYBRID,
    });
  }

  initRoutePolyline(){
    this.routePolyline = new google.maps.Polyline({
      strokeColor: '#ffba29',
      strokeOpacity: 1.0,
      strokeWeight: 6,
      map: this.map,
    });
  }

  attemptGeolocation(){
    var _this = this;
    // TODO move to model
    var url = "https://www.googleapis.com/geolocation/v1/geolocate?key="+ api_keys.google_maps;
    $.post(url,function(data){
      _this.setMapCenter(data.location);
      _this.setMapZoom(14);
    });
  }

  setMapCenter(latLng){
    this.map.setCenter(latLng);
  }

  setMapZoom(zoom){
    this.map.setZoom(zoom);
  }

  getMapZoom(){
    return this.map.getZoom();
  }

  zin(){
    this.map.setZoom(this.map.getZoom() + 1);
  }

  zout(){
    this.map.setZoom(this.map.getZoom() - 1);
  }

  rotateNumDegrees(degrees){
    $('#map').css({'-webkit-transform' : 'rotate('+ degrees +'deg)'});
    $('#draw-route').hide();
    $('.map-rotate-notice').show();
    $('.map-rotate-notice').fadeTo('slow', 0.25).fadeTo('slow', 1.0);
    this.map.setOptions({draggable: false});
  }

  reorient(){
    this.rotation = 0;
    $('#map').css({'-webkit-transform' : 'rotate(0deg)'});
    $('.map-rotate-notice').hide();
    $('#draw-route').show('slow');
    this.map.setOptions({draggable: true});
  }

  toggleMapLock(element){
    this.mapUnlocked = !this.mapUnlocked;
    this.lockedBeforeWaypointEdit = !this.mapUnlocked;
    this.lockedBeforeWaypointEdit = !this.mapUnlocked;
    element ? $(element).toggleClass('secondary') : null;
  }

  orientMap(){
    this.lockedBeforeWaypointEdit = !this.mapUnlocked;
    var bearing = this.model.getWaypointBearing();
    if(bearing){
      if(this.rotation == 0){
        this.toggleMapLock();
        this.rotation = 360-bearing
        this.rotateNumDegrees(this.rotation);
      }else {
        this.reorient();
        this.toggleMapLock();
      }
    }
  }

  updateLayerDropdown(element){
    $('#layers-dropdown').find('i').hide();
    $(element).parent('li').siblings('li').find('a').removeClass('selected');
    $(element).addClass('selected');
    $(element).find('i').show();
  }

  updateWaypointBubble(routePointIndex,bubble){
    if(this.model.markers[routePointIndex].bubble){
      this.model.markers[routePointIndex].bubble.setRadius(Number(bubble));
    }
  }
  /*
    Adds a point to the route path points array for manangement
    Since route path points is an MVCArray bound to the route path
    the new point will show up on the route Polyline automagically.

    Listeners are bound to the point to allow it to be toggled as a waypoint or to be removed entirely
  */
  pushRoutePoint(latLng,supressWpt){
    this.routePolyline.getPath().push(latLng);
    var marker = this.model.buildRouteMarker(latLng, this.map);
    this.bindToMapMarker(marker);
    this.model.markers.push(marker);
    return marker;
  }

  /*
    splices point into route
  */
  insertRoutePointAt(latLng, index){
    this.routePolyline.getPath().insertAt(index,latLng)
    var marker = this.model.buildRouteMarker(latLng, this.map);
    this.bindToMapMarker(marker);
    this.model.markers.splice(index,0,marker);
    this.model.incrementRouteVertexIndecies(index);
    return marker;
  }

  //TODO probably a model function
  insertPointOnEdge(latLng, points){
    /*
      Iterate through the point pairs on the segment
      determine which edge the latLng falls upon
      and insert a new point into route at the index of the edge point
    */
    var idx;

    var tolerance = this.getEdgeTolerance(); //this could be passed in
    for(var i = 1; i < points.length; i++ ){
      // does the event point fit in the bounds of the two reference points before and after the click
      var path = [points[i-1],points[i]];
      var line = new google.maps.Polyline({path: path});

      if(google.maps.geometry.poly.isLocationOnEdge(latLng, line, tolerance)) { // TODO move to model
        idx = i;
        this.insertRoutePointAt(latLng, i); //TODO have something else do this, just return the index value
        break; //we found it, we're done here
      }
      //we haven't found it, increse the tolerance and start over
      if(i == points.length - 1 ){
        tolerance = tolerance*2;
        i = 0;
      }
    }
    return idx;
  }

  /*
    calculates a tolerance for determining if a location falls on an edge based on map zoom level
  */
  getEdgeTolerance(){
    return Math.pow(this.map.getZoom(), -(this.map.getZoom()/5));
  }

  /*
    Adds a point to the route points array at the end, and makes the first waypoint if this is the first point on the route
  */
  addPointToRoute(latLng){
    var marker = this.pushRoutePoint(latLng)

    //if this is the first point on the route make it a waypoint
    if(this.model.markers.length == 1 && this.routePolyline.getPath().length == 1) {
      marker.kmFromStart = 0;
      marker.kmFromPrev = 0;
      marker.waypoint = this.addWaypoint(marker);
    }

    this.model.updateRoute();
  }

  /*
    Removes a point or waypoint from the route
  */
  deletePointFromRoute(marker){
    this.model.deletePointFromRoute(marker);
  }

  /*
    Adds a waypoint to the route waypoints array in the proper spot with accurate distance measurements, update the icon,
    and notify the roadbook observer that there is a new waypoint to render
  */
  addWaypoint(marker) {
    this.model.addWaypoint(marker);
  }
  /*
    Add a bubble to a marker
  */
  addWaypointBubble(routePointIndex,radius,fill) {
    this.model.addWaypointBubble(routePointIndex,radius,fill);
  }

  /*
    determines which points to delete between the user defined delete points
  */
  removeMarkersInQueueFromRoute(){
    this.deleteQueue.sort(function(a,b){return a - b});
    var start = this.deleteQueue[0];
    var end = this.deleteQueue[1];
    for(var i = end;i >= start;i--){
      if(this.model.markers[i].waypoint){
        this.deleteWaypoint(this.model.markers[i]);
      }
      this.deletePointFromRoute(this.model.markers[i]);
    }
  }

  deleteWaypoint(marker){
    this.model.deleteWaypoint(marker);
    marker.setIcon(this.model.buildVertexIcon());
    this.deleteWaypointBubble(marker.routePointIndex);
    marker.waypoint = null;
  }

  deleteWaypointBubble(routePointIndex){
    this.model.deleteWaypointBubble(routePointIndex);
  }

  returnPointToNaturalColor(marker){
    if(marker.waypoint){
      marker.setIcon(this.model.buildWaypointIcon());
    }else {
      marker.setIcon(this.model.buildVertexIcon());
    }
  }

  bindToModel(){
    this.model.route = this.routePolyline.getPath();
    this.model.presenter = this;
  }

  bindToMapSurface(){
    var _this = this;
    this.map.addListener('click', function(evt){
      if(_this.mapUnlocked && !this.markerDeleteMode){
        _this.addPointToRoute(evt.latLng);
      }
    });

    this.map.addListener('rightclick', function(evt){
      var autotrace = _this.dialog.showMessageBox({type: "question",
                                                   buttons: ["Cancel","Ok"],
                                                  defaultId: 1,
                                                  message: "About to auto-trace roads to your route, Are you sure?"});
      if(_this.mapUnlocked && !this.markerDeleteMode && (autotrace == 1)){
        if(_this.routePolyline.getPath().length >0){
          _this.model.getGoogleDirections(evt.latLng);
        }else {
          this.pushRoutePoint(latLng)
          this.updateRoute();
        }
      }
    });
  }

  bindToMapMarker(marker){
    var _this = this;

    /*
      When two items are in the queue, all points in between are deleted.
    */
    google.maps.event.addListener(marker, 'click', function(evt) {
      if(this.waypoint && !this.markerDeleteMode){
        // TODO make into waypoint function and abstract it from here
        $('#roadbook').scrollTop(0);
        $('#roadbook').scrollTop(($(this.waypoint.element).offset().top-100));
      }
    });

    /*
      right clicking on a route point adds it to delete queue.
    */
    google.maps.event.addListener(marker, 'rightclick', function(evt) {
      _this.markerDeleteMode = true;
      if(_this.deleteQueue.length == 0){
        _this.deleteQueue.push(marker.routePointIndex);
        marker.setIcon(_this.model.buildDeleteQueueIcon());
      } else {
        _this.deleteQueue.push(marker.routePointIndex);
        _this.removeMarkersInQueueFromRoute();
        _this.model.updateRoute();
        _this.displayEdge = true; //we have to set this because the mouse out handler that usually handles this gets nuked in the delete
        _this.deleteQueue = [];
        _this.markerDeleteMode = false
      }
    });

    /*
      double clicking on a route point toggles whether the point is a waypoint or not
    */
    google.maps.event.addListener(marker, 'dblclick', function(evt) {
      //If the point has a waypoint remove it, otherwise add one
      if(!this.markerDeleteMode){
        if(this.waypoint){
          _this.deleteWaypoint(this);
        } else {
          _this.addWaypoint(this);
          $('#roadbook').scrollTop(0);
          $('#roadbook').scrollTop(($(this.waypoint.element).offset().top-100));
        }
        //recompute distances between waypoints
        _this.model.updateRoute();
      }
    });

    /*
      Dragging the point updates the latLng vertex position on the route Polyline
    */
    google.maps.event.addListener(marker, 'drag', function(evt) {
      _this.routePolyline.getPath().setAt(this.routePointIndex, evt.latLng);
      if(this.bubble){
        this.bubble.setCenter(evt.latLng);
      }
    });

    google.maps.event.addListener(marker, 'dragend', function(evt) {
      _this.model.updateRoute();
    });

    /*
      turns off display of the potential point marker on the route path so UI functions over a point are not impeeded.
    */
    google.maps.event.addListener(marker, 'mouseover', function(evt) {
      _this.displayEdge = false;
      if(this.markerDeleteMode){
        marker.setIcon(_this.model.buildDeleteQueueIcon())
      }
    });

    /*
      turns display of the potential point marker on the route path back on.
    */
    google.maps.event.addListener(marker, 'mouseout', function(evt) {
      _this.displayEdge = true;
      if(this.markerDeleteMode && (marker.routePointIndex != _this.deleteQueue[0])){
        _this.returnPointToNaturalColor(marker);
      }
    });
  }

  bindToMapPolyline(){
    var _this = this;
    /*
      hovering over the route between verticies will display a handle, which if clicked on will add a point to the route
    */
    google.maps.event.addListener(this.routePolyline, 'mouseover', function(evt){
      /*
        If we aren't over a point display a handle to add a new route point if the map is editable
      */
      if(_this.displayEdge && !this.markerDeleteMode){
        var dragging = false;
        var handle = _this.model.buildHandleMarker(evt.latLng, this.map)
        google.maps.event.addListener(_this.routePolyline, 'mousemove', function(evt){
          if(_this.displayEdge && _this.mapUnlocked){
            handle.setPosition(evt.latLng);
          } else {
            handle.setMap(null);
          }
        });

        /*
          make the point go away if the mouse leaves the route, but not if it's being dragged
        */
        google.maps.event.addListener(_this.routePolyline, 'mouseout', function(evt){
          if(!dragging){
            handle.setMap(null);
          }
        });

        /*
          add the point to the route
        */
        google.maps.event.addListener(handle, 'mousedown', function(evt){
          dragging = true;
          var idx = _this.insertPointOnEdge(evt.latLng, _this.routePolyline.getPath().getArray());
          /*
            Add listeners to move the new route point and the route to the mouse drag position of the handle
          */
          google.maps.event.addListener(handle, 'drag', function(evt){
            if(idx !== undefined){ //in rare instances this can happen and causes the map to glitch out
              _this.model.updateMarkerPosition(idx, evt.latLng)
            }
          });

          /*
            get rid of the handle
          */
          google.maps.event.addListener(handle, 'mouseup', function(evt){
            dragging = false;
            _this.model.updateRoute();
            this.setMap(null);
          });
        });
      }
    });
  }

  bindToUI(){
    /*
        Nav Bar
    */
    var _this = this;
    $('#zin').click(function(){
      _this.zin();
      $(this).blur();
    });

    $('#zout').click(function(){
      _this.zout();
      $(this).blur();
    });

    $('#map-hybrid-layer').click(function(){
      _this.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
      _this.updateLayerDropdown(this)
    });

    $('#map-satellite-layer').click(function(){
      _this.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
      _this.updateLayerDropdown(this)
    });

    $('#map-roadmap-layer').click(function(){
      _this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      _this.updateLayerDropdown(this)
    });

    $('#map-terrain-layer').click(function(){
      _this.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
      _this.updateLayerDropdown(this)
    });

    $('#draw-route').click(function(){
      _this.toggleMapLock(this);
    });

    /*
        Waypoint Palette
    */
    $('#orient-map').click(function(){
      _this.orientMap();
    });

    $('#hide-palette').click(function(){
      // _this.toggleMapLock();
      _this.reorient();
    });
  }
};
