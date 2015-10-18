var WaypointModel = Backbone.Model.extend({
  url: 'waypoints',
  defaults: {
    lat: 0,
    long: 0,
    totalDistance: 0,
    relativeDistance: 0,
    notes: '', //this will probably end up being an object
    tulip: '', //this will probably end up being an object
    cap: 0,
  },
});

// var WaypointsCollection = Backbone.Collection.extend({
//   model: WaypointModel,
//   localStorage: new Store("tulip-waypoints")
// });


var WaypointView = Backbone.View.extend({
  el: '#roadbook',
  template: _.template($('#waypoint-template').html()),

  initialize: function() {
    this.listenTo(this.model, 'sync change', this.render);
    this.model.fetch();
    this.render();
  },

  render: function() {
    var html = this.template(this.model.toJSON());
    this.$el.append(html);
    return this;
  },
});
