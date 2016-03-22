var Waypoint = Class({
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
            tulipJson: OBJECT,
            notes: STRING,
    }
  */
  create: function(roadbook, opts){

    this.kmFromStart  = ko.observable(opts.distances.kmFromStart);
    this.miFromStart  = ko.observable(opts.distances.miFromStart);
    this.kmFromPrev   = ko.observable(opts.distances.kmFromPrev);
    this.miFromPrev   = ko.observable(opts.distances.miFromPrev);
    this.exactHeading = ko.observable(opts.angles.heading);

    this.distFromPrev   = ko.computed(this.computedDistanceFromPrev, this);
    this.totalDistance  = ko.computed(this.computedTotalDistance, this);
    this.heading        = ko.computed(this.computedHeading, this);
    this.roadbook = roadbook;

    var _this = this;
    var angle = opts.angles.relativeAngle;
    var json = opts.tulipJson
    ko.bindingHandlers.waypointCanvasRendered = {
      init: function(element){
        _this.initTulip(element, angle, json);
        _this.initTulipListeners($(element).parents('.waypoint-tulip'));
      }
    };

    this.notes = ko.observable(opts.notes);
  },

  initTulip: function(element, angle, json){
    this.tulip = new Tulip(element, angle, json);
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

  initTulipListeners: function(element){
    var _this = this;
    $(element).click(function(){
      if(_this.roadbook.requestCanvasEdit(_this.tulip)){
        _this.tulip.beginEdit();
      }
    });
  },

  serializeTulip: function() {
    return this.tulip.serialize()
  },
});
