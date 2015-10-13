//36.811740, -108.286613
var map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          attributions: "ersi",
          url: 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
              'World_Imagery/MapServer/tile/{z}/{y}/{x}'
        })
      })
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([-108.286613, 36.811740]),
      zoom: 10,
      maxZoom: 19,
      rotation: 0,
    }),
    interactions: ol.interaction.defaults({mouseWheelZoom:false}),
  });
