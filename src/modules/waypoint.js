var Waypoint = Class({
  create: function(opts){
    this.id  = opts.id
    this.totalDistance = opts.totalDistance;
    this.relativeDistance = opts.relativeDistance;
    this.tulipJSON = opts.tulipJSON
    this.notes = opts.notes;
  },

  initializeTulip: function(){

  },
});
