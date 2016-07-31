/*
  A module for providing the application with the means to control the map via the UI
*/
var MapControls = Class({
  singleton: true,

  create: function() {
    this.rotation = 0;
    this.initListeners();
  },

  disableMapInteraction: function(){
    // app.canEditMap = false;
    app.map.setOptions({draggable: false});
    $('#draw-route').click();
    $('#draw-route').hide();
    $('#remove-route').hide();
    $('.map-rotate-notice').show();
    $('.map-rotate-notice').fadeTo('slow', 0.25).fadeTo('slow', 1.0);
  },

  enableMapInteraction: function(){
    // app.canEditMap = true;
    app.map.setOptions({draggable: true});
    $('#draw-route').click();
    $('#draw-route').show('slow');
    $('#remove-route').show('slow');
    $('.map-rotate-notice').hide();
  },

  zin: function(){
    app.map.setZoom(app.map.getZoom() + 1);
  },

  zout: function(){
    app.map.setZoom(app.map.getZoom() - 1);
  },

  rotateNumDegrees: function(degrees){
    $('#map').css({'-webkit-transform' : 'rotate('+ degrees +'deg)'});
  },

  reorient: function(){
    this.rotation = 0;
    $('#map').css({'-webkit-transform' : 'rotate(0deg)'});
  },

  initListeners: function(){
    /*
        Map Listeners
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
      app.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
      $('#layers-dropdown').find('i').hide();
      $(this).find('i').show();
    });

    $('#map-satellite-layer').click(function(){
      app.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
      $('#layers-dropdown').find('i').hide();
      $(this).find('i').show();
    });

    $('#map-roadmap-layer').click(function(){
      app.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      $('#layers-dropdown').find('i').hide();
      $(this).find('i').show();
    });

    $('#map-terrain-layer').click(function(){
      app.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
      $('#layers-dropdown').find('i').hide();
      $(this).find('i').show();
    });

    $('#draw-route').click(function(){
      app.canEditMap = !app.canEditMap;
      $(this).toggleClass('secondary');
      var markers = app.mapEditor.routeMarkers;
      for(i=0;i<markers.length;i++){
        if(app.canEditMap){
          markers[i].setDraggable(true);
        } else {
          markers[i].setDraggable(false);
        }
      }
    });

    $('#remove-route').click(function(){
      $(this).toggleClass('secondary');
      app.pointDeleteMode = !app.pointDeleteMode;
      if(app.mapEditor.pointDeleteQueue.length){
        var point = app.mapEditor.routeMarkers[app.mapEditor.pointDeleteQueue[0]];
        app.mapEditor.returnPointToNaturalColor(point);
        app.mapEditor.pointDeleteQueue = [];
      }
    });

  },
});
