var RoadbookModel = Backbone.Model.extend({
  defaults: {
    name: '',
    notes: '',
    totalDistance: 0,
  },
});

var RoadbookView = Backbone.View.extend({
  // el - stands for element. Every view has a element associate in with HTML
  //      content will be rendered.
  el: '#roadbook',
  // It's the first function called when this view it's instantiated.
  initialize: function(){
    this.render();
  },
  // $el - it's a cached jQuery object (el), in which you can use jQuery functions
  //       to push content. Like the Hello World in this case.
  render: function(){
    this.$el.html("Hello World this is the roadbook");
  }
});
