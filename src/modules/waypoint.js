var Waypoint = Class({
  _this: {},
  /*

    opts: {
            distances: {
              kmFromStart: FLOAT,
              miFromStart: FLOAT,
              kmFromPrev: FLOAT,
              miFromPrev: FLOAT,
            },
            angles: {
              heading: INTEGER,
              relativeAngle: INTEGER.
            },
            tulip: OBJECT,
            notes: STRING,
    }
  */
  create: function(opts){
    // _this = this;
    this.kmFromStart  = ko.observable(opts.distances.kmFromStart);
    this.miFromStart  = ko.observable(opts.distances.miFromStart);
    this.kmFromPrev   = ko.observable(opts.distances.kmFromPrev);
    this.miFromPrev   = ko.observable(opts.distances.miFromPrev);
    this.exactHeading = ko.observable(opts.angles.heading);
    this.tulipJson    = ko.observable();

    this.distFromPrev   = ko.computed(this.computedDistanceFromPrev, this);
    this.totalDistance  = ko.computed(this.computedTotalDistance, this);
    this.heading        = ko.computed(this.computedHeading, this);


    // ko.bindingHandlers.waypointCanvasRendered = {
    //   init: function(element){
    //     _this.initializeTulip(element, null, null);
    //   }
    // };

    this.notes = ko.observable(opts.notes);
  },

  initializeTulip: function(element, json, relativeAngle){
    this.tulip = new Tulip(element);
  },

  updateWaypoint: function (distances, heading){
    if(distances){
      this.kmFromStart(distances.kmFromStart);
      this.miFromStart(distances.miFromStart);
      this.kmFromPrev(distances.kmFromPrev);
      this.miFromPrev(distances.miFromPrev);
    }
    if(heading){
      this.exactHeading(heading)
    }
  },

  computedDistanceFromPrev: function(){
    if(this.miFromPrev() && this.kmFromPrev()){
      return this.miFromPrev().toFixed(2);
    } else {
      return '0.00'
    }
  },

  computedTotalDistance: function(){
    return this.miFromStart().toFixed(2);
  },

  computedHeading: function(){
    var heading = Math.round(this.exactHeading());
    //round the exaxt heading and zero pad it
    return Array(Math.max(3 - String(heading).length + 1, 0)).join(0) + heading + '\xB0';
  },

});
