/*
  A module for providing the application with the means to control the map via the UI
*/
// TODO refactor this to use MVC pattern and act as a controller for the map model
class MapController{

  constructor(model){
    //NOTE dependencies app.map[setZoom,setOptions,setMapTypeId], app, app.mapEditor[routePoints,routeMarkers,]
    // TODO reduce this to only publishing to the MapModel the map should be moved to live here.
    this.model = model;
    this.map = model.map;
    this.rotation = 0;
    this.lockedBeforeWaypointEdit = false;
    this.canEditMap = true;

    this.bindToUI();
    this.bindToMapSurface();
    this.bindToMapMarker();
    this.bindToMapPolyline();
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
    this.canEditMap = !this.canEditMap;
     element ? $(element).toggleClass('secondary') : null;
    //TODO this should go in the MapModel because it alters state
    if(this.canEditMap){
      this.model.unlockMap();
      this.lockedBeforeWaypointEdit = false;
    } else {
      this.model.lockMap();
      this.lockedBeforeWaypointEdit = true;
    }
  }

  orientMap(){

  }

  updateLayerDropdown(element){
    $('#layers-dropdown').find('i').hide();
    $(element).parent('li').siblings('li').find('a').removeClass('selected');
    $(element).addClass('selected');
    $(element).find('i').show();
  }

  bindToMapSurface(){
    console.log("i need implimented (surface)");;
  }

  bindToMapMarker(){
    console.log("i need implimented (marker)");;
  }

  bindToMapPolyline(){
    console.log("i need implimented (polyline)");;
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
      var i = app.roadbook.currentlyEditingWaypoint.routePointIndex; //TODO get this from the model
      _this.lockedBeforeWaypointEdit = !_this.canEditMap;
      if(i > 0){
        var heading = google.maps.geometry.spherical.computeHeading(_this.model.routePoints.getAt(i-1), _this.model.routePoints.getAt(i)); //TODO get this from the model
        if(_this.rotation == 0){
          _this.toggleMapLock();
          _this.rotation = 360-heading
          _this.rotateNumDegrees(_this.rotation);
        }else {
          _this.reorient();
          _this.toggleMapLock();
        }
      }
    });

    $('#hide-palette').click(function(){
      _this.toggleMapLock();
      _this.reorient();
    });
  }
};
