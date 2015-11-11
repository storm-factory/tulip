var Waypoint = Class({
  create: function(opts){
    console.log(opts);
    console.log(opts.kmFromStart);
    this.id  = opts.id
    this.kmFromStart = opts.kmFromStart;
    this.miFromStart = opts.miFromStart;
    this.kmFromPrev = opts.kmFromPrev;
    this.miFromPrev = opts.miFromPrev;

    this.distFromPrev = opts.miFromPrev;
    this.totalDistance = opts.miFromStart;
    this.tulipJSON = opts.tulipJSON
    this.notes = opts.notes;
  },

  initializeTulip: function(){

  },
});
