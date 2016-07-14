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
    $('#map-rotate-notice').show('fast');
    $('#map-rotate-notice').fadeTo('slow', 0.25).fadeTo('slow', 1.0);
  },

  enableMapInteraction: function(){
    // app.canEditMap = true;
    app.map.setOptions({draggable: true});
    $('#draw-route').click();
    $('#draw-route').show('slow');
    $('#map-rotate-notice').hide('slow');
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

  },
});
