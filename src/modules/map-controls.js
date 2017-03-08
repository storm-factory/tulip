/*
  A module for providing the application with the means to control the map via the UI
*/
class MapControls{

  constructor(){
    this.rotation = 0;
    this.lockedBeforeWaypointEdit = false;
    this.initListeners();
  }

  zin(){
    app.map.setZoom(app.map.getZoom() + 1);
  }

  zout(){
    app.map.setZoom(app.map.getZoom() - 1);
  }

  rotateNumDegrees(degrees){
    $('#map').css({'-webkit-transform' : 'rotate('+ degrees +'deg)'});
    $('#draw-route').hide();
    $('.map-rotate-notice').show();
    $('.map-rotate-notice').fadeTo('slow', 0.25).fadeTo('slow', 1.0);
    app.map.setOptions({draggable: false});
  }

  reorient(){
    this.rotation = 0;
    $('#map').css({'-webkit-transform' : 'rotate(0deg)'});
    $('.map-rotate-notice').hide();
    $('#draw-route').show('slow');
    app.map.setOptions({draggable: true});
  }

  initListeners(){
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
      $(this).parent('li').siblings('li').find('a').removeClass('selected');
      $(this).addClass('selected');
      $(this).find('i').show();
    });

    $('#map-satellite-layer').click(function(){
      app.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
      $('#layers-dropdown').find('i').hide();
      $(this).parent('li').siblings('li').find('a').removeClass('selected');
      $(this).addClass('selected')
      $(this).find('i').show();
    });

    $('#map-roadmap-layer').click(function(){
      app.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      $('#layers-dropdown').find('i').hide();
      $(this).parent('li').siblings('li').find('a').removeClass('selected');
      $(this).addClass('selected')
      $(this).find('i').show();
    });

    $('#map-terrain-layer').click(function(){
      app.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
      $('#layers-dropdown').find('i').hide();
      $(this).parent('li').siblings('li').find('a').removeClass('selected');
      $(this).addClass('selected')
      $(this).find('i').show();
    });

    $('#draw-route').click(function(){
      app.canEditMap = !app.canEditMap;
      $(this).toggleClass('secondary');
      var markers = app.mapEditor.routeMarkers;
      for(i=0;i<markers.length;i++){
        if(app.canEditMap){
          markers[i].setDraggable(true);
          this.lockedBeforeWaypointEdit = false;
        } else {
          markers[i].setDraggable(false);
          this.lockedBeforeWaypointEdit = true;
        }
      }
    });

  }
};
