/*
  A module for providing the application with the means to control the map via the UI
*/
var MapControls = Class({
  singleton: true,

  create: function() {
    this.rotation = 0;
    this.initListeners();
    // app.map = app.mapEditor.map;
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
        $('#draw-route').click();
        $('#draw-route').fadeTo('slow', 0.25).fadeTo('slow', 1.0);
      }
    });

    $('#reorient').click(function(){
      _this.reorient();
      _this.rotation = 0;
      if(!app.canEditMap){
        $('#draw-route').click();
      }
    });

    $('#anti-clockwise').click(function(){
      _this.rotate(-1);
      if(app.canEditMap){
        $('#draw-route').click();
        $('#draw-route').fadeTo('slow', 0.5).fadeTo('slow', 1.0);
      }
    });
  },
});
