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
    app.map.setOptions({draggable: false});
    $('#draw-route').click();
    $('#draw-route').hide();
    $('#map-rotate-notice').show('fast');
    $('#map-rotate-notice').fadeTo('slow', 0.25).fadeTo('slow', 1.0);
  },

  enableMapInteraction: function(){
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

  rotate: function(directionModifier){
    this.rotation += 5*directionModifier;

    $('#map').css({'-webkit-transform' : 'rotate('+ this.rotation +'deg)'});
  },

  rotateNumDegrees: function(degrees){
    console.log('here: '+ degrees);
    $('#map').css({'-webkit-transform' : 'rotate('+ degrees +'deg)'});
  },

  reorient: function(){
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

    $('#clockwise').click(function(){
      _this.rotate(1);
      if(app.canEditMap){
        _this.disableMapInteraction();
      }
    });

    $('#reorient').click(function(){
      _this.reorient();
      _this.rotation = 0;
      if(!app.canEditMap){
        _this.enableMapInteraction();
      }
    });

    $('#anti-clockwise').click(function(){
      _this.rotate(-1);
      if(app.canEditMap){
        $('#draw-route').click();
        $('#draw-route').hide();
        $('#map-rotate-notice').show('fast');
        app.map.setOptions({draggable: false});
        $('#map-rotate-notice').fadeTo('slow', 0.5).fadeTo('slow', 1.0);
      }
    });
  },
});
