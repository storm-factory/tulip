var Waypoint = Class({
  create: function(opts){
    this.id  = opts.id
    this.kmFromStart = ko.observable(opts.kmFromStart);
    this.miFromStart = ko.observable(opts.miFromStart);
    this.kmFromPrev = ko.observable(opts.kmFromPrev);
    this.miFromPrev = ko.observable(opts.miFromPrev);

    this.distFromPrev = ko.observable(opts.miFromPrev);
    this.totalDistance = ko.computed(this.computedTotalDistance, this);
    this.tulipJSON = opts.tulipJSON
    this.notes = ko.observable(opts.notes);
  },

  initializeTulip: function(){

  },

  updateWaypoint: function (distances){

    this.kmFromStart(distances.kmFromStart);
    this.miFromStart(distances.miFromStart);
    this.kmFromPrev(distances.kmFromPrev);
    this.miFromPrev(distances.miFromPrev);


    // this.totalDistance(this.miFromStart);
  },

  computedTotalDistance: function(){
    return this.miFromStart().toFixed(2);
  },
});
