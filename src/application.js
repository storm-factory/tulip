/*
  Define the application namespace
*/
var app = {};

function initMap() {
  app.mapEditor = new MapEditor();
}
$(document).ready(function(){
  app.roadbook = new Roadbook();
  app.drawRoute = false;


  app.listeners = {
    bind: function(){

      /*
          App Listeners
      */
      $('#draw-route').click(function(){

      });

      $('#toggle-roadbook').click(function(){
        $('.roadbook-container').toggleClass('collapsed');
        $('.roadbook-container').toggleClass('expanded');

        $('#toggle-roadbook i').toggleClass('fi-arrow-down');
        $('#toggle-roadbook i').toggleClass('fi-arrow-up');
      });
      /*
          Map Listeners
      */
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

  //TODO move to map controls module


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
