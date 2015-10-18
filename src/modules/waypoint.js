var WaypointModel = Backbone.Model.extend({
  defaults: {
    lat: 0,
    long: 0,
    totalDistance: 0,
    relativeDistance: 0,
    notes: '',
    cap 0,
  },
});

var WaypointsCollection = Backbone.Collection.extend({
  model: WaypointModel,
  localStorage: new Store("tulip-waypoints")
});

var WaypointsView = Backbone.View.extend({

}):
