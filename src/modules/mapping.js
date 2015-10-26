//36.811740, -108.286613
var MapEditor = Class({
  create: function(){
    this.initializeMap();
    this.initializeHandlerControls();
  },

  initializeMap: function(){
    this.waypoints = [];
    this.vectorSource = new ol.source.Vector({
      features: this.waypoints //add an array of features
    });
    this.vectorLayer = new ol.layer.Vector({
                              source: this.vectorSource,
                            });

    this.map = new ol.Map({
        target: 'map',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.XYZ({
              attributions: "ersi",
              url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            })
          }),
          this.vectorLayer
        ],
        view: new ol.View({
          center: ol.proj.fromLonLat([-108.286613, 36.811740]),
          zoom: 10,
          maxZoom: 19,
          rotation: 0,
        }),
        interactions: ol.interaction.defaults({mouseWheelZoom:false}),
      });
  },

  initializeHandlerControls: function(){
    var _this = this;
    this.map.on('singleclick', function(evt) {
      _this.addWaypoint(evt.coordinate);
     });

  },

  addWaypoint: function(espg3875LongLat){
    var waypoint = new ol.Feature({
      geometry: new ol.geom.Point(espg3875LongLat),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#ffcc33',
          width: 2
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#ffcc33'
          })
        })
      }),
    });

    this.waypoints.push(waypoint)
    console.log(espg3875LongLat);
    console.log(this.vectorLayer);
    this.vectorSource.set('features', this.waypoints);

  },
});
