/*
  A module for providing the application with the means to control the map via the UI
*/
// TODO refactor this to use MVC pattern and act as a controller for the map model
class MapController{

  constructor(model){
    //NOTE dependencies app.map[setZoom,setOptions,setMapTypeId], app, app.mapEditor[routePoints,routeMarkers,]
    // TODO reduce this to only publishing to the MapModel the map should be moved to live here(maybe).
    this.model = model;
    this.map = model.map;
    this.rotation = 0;
    this.lockedBeforeWaypointEdit = false;
    this.canEditMap = true;
    this.dialog = require('electron').remote.dialog;

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
    if(this.canEditMap){
      this.model.unlockMap();
      this.lockedBeforeWaypointEdit = false;
    } else {
      this.model.lockMap();
      this.lockedBeforeWaypointEdit = true;
    }
  }

  orientMap(){
    this.lockedBeforeWaypointEdit = !this.canEditMap;
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

  bindToMapSurface(){
    var _this = this;
    // Add a listener for the map's click event
    this.map.addListener('click', function(evt){
      if(_this.canEditMap && !app.pointDeleteMode){
        _this.model.addPointToRoute(evt.latLng);
      }
    });

    this.map.addListener('rightclick', function(evt){

      var autotrace = _this.dialog.showMessageBox({type: "question",
                                                   buttons: ["Cancel","Ok"],
                                                  defaultId: 1,
                                                  message: "About to auto-trace roads to your route, Are you sure?"});
      
      if(_this.canEditMap && !app.pointDeleteMode && (autotrace == 1)){
        _this.model.getGoogleDirections(evt.latLng);
      }
    });
  }

  bindToMapMarker(){
    console.log("i need implimented (marker)");
  }

  bindToMapPolyline(){
    console.log("i need implimented (polyline)");
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
      _this.toggleMapLock();
      _this.reorient();
    });
  }
};
