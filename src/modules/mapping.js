
var MapEditor = Class({
  //maintain contecxt in listeners
  _this: {},

  create: function(){
    _this = this;
    this.initializeMap();
    this.initializeListeners();
    this.routePathPoints = this.routePath.getPath();
    this.routePointMarkers = [];
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
      strokeColor: '#ffba29',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      // editable: true,
      map: this.map,
      // suppressUndo: true,
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
        _this.addWaypoint(evt);
      }
    });

    google.maps.event.addListener(this.routePath, 'mousemove', function(evt){
      // sort of works, fires when trying to right click on vertecies
      //still needs to add new vertex
      var point = new google.maps.Marker({
                              icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 3,
                                strokeWeight: 2,
                                strokeColor: '#ffba29',
                                fillColor: '#787878',
                                fillOpacity: .75
                              },
                              map: this.map,
                              position: evt.latLng,
                              draggable: true,
                              mapVertex: evt.vertex,
                            });
      google.maps.event.addListener(_this.routePath, 'mousemove', function(evt){
        point.setPosition(evt.latLng);
      });
      google.maps.event.addListener(_this.routePath, 'mouseout', function(evt){
        point.setMap(null);
      });
    });

  },

  addRoutePoint: function(evt){
    _this.routePathPoints.push(evt.latLng);
    var point = new google.maps.Marker({
                            icon: {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: 5,
                              strokeWeight: 2,
                              strokeColor: '#ffba29',
                              fillColor: '#787878',
                              fillOpacity: .75
                            },
                            map: _this.map,
                            position: evt.latLng,
                            draggable: true,
                            mapVertexIndex: _this.routePathPoints.indexOf(evt.latLng),
                          });
    google.maps.event.addListener(point, 'rightclick', function(evt) {
      _this.deletePoint(this);
    });

    _this.routePointMarkers.push(point);


  },

  deletePoint: function(point){
    console.log(point);
    var pointIndex = this.routePointMarkers.indexOf(point);
    var vertexIndex = point.mapVertexIndex;
    console.log(vertexIndex);
    point.setMap(null);
    if(pointIndex >= 0){
        this.routePointMarkers.splice(pointIndex,1);
        for(i = pointIndex; i < this.routePointMarkers.length; i++){
          var point = this.routePointMarkers[i];
          point.mapVertexIndex = point.mapVertexIndex - 1;
        }
        if(vertexIndex >= 0) {
          this.routePathPoints.removeAt(vertexIndex)
        }

    }
  },

  addWaypoint: function(evt){
    var waypointMarker = new google.maps.Marker({
                            icon: {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: 10,
                              strokeWeight: 2,
                              strokeColor: '#ffba29',
                              fillColor: '#787878',
                              fillOpacity: .75
                            },
                            map: this.map,
                            position: evt.latLng,
                            draggable: true,
                            mapVertex: evt.vertex,
                          });
    // console.log(this.routePathPoints.getAt(evt.vertex).position);
    // waypointMarker.bindTo('position', this.routePathPoints.getAt(evt.vertex),'position');
    console.log(waypointMarker.mapVertex);
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
});
