
var MapEditor = Class({
  //maintain contecxt in listeners
  _this: {},

  create: function(){
    _this = this;
    this.initializeMap();
    this.initializeListeners();
    this.routePathPoints = this.routePath.getPath();
  },

  initializeMap: function(){
    this.map = new google.maps.Map(document.getElementById('map'), {
       center: {lat: 36.068209, lng: -105.629669},
       zoom: 4,
       disableDefaultUI: true,
       mapTypeId: google.maps.MapTypeId.HYBRID
    });

    this.attemptGeolocation();

    this.routePath = new google.maps.Polyline({
      strokeColor: 'yellow',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      editable: true,
      map: this.map,
      suppressUndo: true
    });
  },

  initializeListeners: function() {
    // Add a listener for the click event
    this.map.addListener('click', this.addRoutePoint);

    google.maps.event.addListener(this.routePath, 'rightclick', function(evt) {
      // Check if click was on a vertex control point
      if (evt.vertex != undefined) {
        _this.routePathPoints.removeAt(evt.vertex);
      }
    });

    google.maps.event.addListener(this.routePath, 'dblclick', function(evt) {
      // Check if click was on a vertex control point
      if (evt.vertex != undefined) {
        console.log('turn this into a waypoint! (unless it is one...)');
      }
    });
  },

  attemptGeolocation: function(){
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      _this.map.setCenter(pos);
      _this.map.setZoom(8);
    });
  },

  addRoutePoint: function(evt){
    _this.routePathPoints.push(evt.latLng);
  },
});
