
var MapEditor = Class({
  //maintain contecxt in listeners
  _this: {},

  create: function(){
    _this = this;
    this.initializeMap();
    this.initializeListeners();
    this.routePath = poly.getPath();
  },

  initializeMap: function(){
    this.map = new google.maps.Map(document.getElementById('map'), {
       center: {lat: 36.068209, lng: -105.629669},
       zoom: 4,
       disableDefaultUI: true,
       mapTypeId: google.maps.MapTypeId.HYBRID
    });

    this.attemptGeolocation();

    poly = new google.maps.Polyline({
      strokeColor: 'yellow',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    poly.setMap(this.map);
  },

  initializeListeners: function() {
    // Add a listener for the click event
    this.map.addListener('click', this.addRoutePoint);
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
    _this.routePath.push(evt.latLng);
  },
});
