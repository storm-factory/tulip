/*
  A module for providing the application with the means to control the map via the UI
*/
var MapControls = Class({
  singleton: true,

  create: function() {
    this.rotation = 0;
    this.initListeners();
    // this.map = app.mapEditor.map;
  },

  zin: function(){
    this.map.setZoom(this.map.getZoom() + 1);
  },

  zout: function(){
    this.map.setZoom(this.map.getZoom() - 1);
  },

  rotate: function(directionModifier){
    rotation += 5*directionModifier;
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
    });

    $('#reorient').click(function(){
      _this.reorient();
    });

    $('#anti-clockwise').click(function(){
      _this.rotate(-1);
    });
  },
});
