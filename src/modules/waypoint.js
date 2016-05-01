var Waypoint = Class({
  /*

    opts: {
            distances: {
              kmFromStart: FLOAT,
              kmFromPrev: FLOAT,
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
    this.kmFromPrev   = ko.observable(opts.distances.kmFromPrev);
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

    // this.notes = ko.observable(opts.notes);
    ko.bindingHandlers.waypointNotesRendered = {
      init: function(element){
        _this.initNote(element, json);
        _this.initNoteListeners($(element).parents('.waypoint-note'));
      }
    };
  },

  initNote: function(element, json){
    this.note = new Note(element, json)
  },

  initTulip: function(element, angle, json){
    this.tulip = new Tulip(element, angle, json);
  },

  updateWaypoint: function (distances, heading){
    if(distances){
      this.kmFromStart(distances.kmFromStart);
      this.kmFromPrev(distances.kmFromPrev);
    }
    if(heading){
      this.exactHeading(heading)
    }
  },

  computedDistanceFromPrev: function(){
    if(this.kmFromPrev() && this.kmFromPrev()){
      return this.kmFromPrev().toFixed(2);
    } else {
      return '0.00'
    }
  },

  computedTotalDistance: function(){
    return this.kmFromStart().toFixed(2);
  },

  computedHeading: function(){
    var heading = Math.round(this.exactHeading());
    //round the exaxt heading and zero pad it
    return Array(Math.max(3 - String(heading).length + 1, 0)).join(0) + heading + '\xB0';
  },

  initTulipListeners: function(element){
    var _this = this;
    $(element).click(function(e){
      if(_this.roadbook.requestCanvasEdit(_this.tulip)){
        _this.tulip.beginEdit(); //TODO we need to have some sort of event handling, maybe check if it is default track, track, or glyph, and assign the proper editor
      }

      $('#roadbook-waypoints').children().hide();
      $(element).parents('.waypoint.row').show();
      $('#waypoint-palette').show();
    });
  },

  initNoteListeners: function(element){
    var _this = this;
    $(element).click(function(e){
      $('#roadbook-waypoints').children().hide();
      $(element).parents('.waypoint.row').show();
      $('#waypoint-palette').show();
    });
  },

  serializeTulip: function() {
    return this.tulip.serialize()
  },
});
