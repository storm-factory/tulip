var Waypoint = Class({
  create: function(opts){
    this.id  = opts.id
    this.kmFromStart = opts.kmFromStart;
    this.miFromStart = opts.miFromStart;
    this.kmFromPrev = opts.kmFromPrev;
    this.miFromPrev = opts.miFromPrev;

    this.distFromPrev = ko.observable(opts.miFromPrev);
    this.totalDistance = ko.observable(opts.miFromStart);
    this.tulipJSON = opts.tulipJSON
    this.notes = ko.observable(opts.notes);
  },

  initializeTulip: function(){

  },

  updateWaypoint: function (distances){

    this.kmFromStart = distances.kmFromStart;
    this.miFromStart = distances.miFromStart;
    this.kmFromPrev = distances.kmFromPrev;
    this.miFromPrev = distances.miFromPrev;


    this.totalDistance(this.miFromStart);
  },
});
