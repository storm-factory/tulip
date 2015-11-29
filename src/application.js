/*
  Define the application namespace
*/
var app = {};

function initMap() {
  app.mapEditor = new MapEditor();
}
$(document).ready(function(){
  app.roadbook = new Roadbook();


  //TODO move to map controls module
  app.listeners = {
    bind: function(){
      $('#zin').click(function(){
        // var map = app.mapEditor.map;
        // map.setZoom(map.getZoom() + 1);
        app.mapControls.zin();
        $(this).blur();
      });

      $('#zout').click(function(){
        // var map = app.mapEditor.map;
        // map.setZoom(map.getZoom() - 1);
        app.mapControls.zout();
        $(this).blur();
      });

      $('#clockwise').click(function(){
        app.mapControls.rotate(1);
      });

      $('#reorient').click(function(){
        app.mapControls.reorient();
      });

      $('#anti-clockwise').click(function(){
        app.mapControls.rotate(-1);
      });


    },
  };
  var rotation = 0;
  app.mapControls = {
    map: function(){
      return app.mapEditor.map;
    },

    zin: function(){
      var map = this.map();
      map.setZoom(map.getZoom() + 1);
    },

    zout: function(){
      var map = this.map();
      map.setZoom(map.getZoom() - 1);
    },

    rotate: function(directionModifier){
      rotation += 5*directionModifier;
      $('#map').css({'-webkit-transform' : 'rotate('+ rotation +'deg)'});
    },

    reorient: function(){
      $('#map').css({'-webkit-transform' : 'rotate(0deg)'});
    },
  }
  app.listeners.bind();
  ko.applyBindings(app.roadbook);
});
