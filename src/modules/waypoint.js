var Waypoint = Class({
  /*

    wptJson: {
            distances: {
              kmFromStart: FLOAT,
              kmFromPrev: FLOAT,
            },
            angles: {
              heading: INTEGER,
              relativeAngle: INTEGER.
            },
            tulipJson: OBJECT,
            notes: {
              glyphs:[],
              text: STRING,
            },
    }
  */
  create: function(roadbook, wptJson){

    this.kmFromStart  = ko.observable(wptJson.distances.kmFromStart);
    this.kmFromPrev   = ko.observable(wptJson.distances.kmFromPrev);
    this.exactHeading = ko.observable(wptJson.angles.heading);
    // TODO grab this from the json
    // this.lat
    // this.lon

    this.distFromPrev   = ko.computed(this.computedDistanceFromPrev, this);
    this.totalDistance  = ko.computed(this.computedTotalDistance, this);
    this.heading        = ko.computed(this.computedHeading, this);

    // waypoints don't get any note info when they are added via UI so intialize them to blank
    var text = wptJson.notes == undefined ? '' : wptJson.notes.text;
    var glyphs = wptJson.notes == undefined ? [] : wptJson.notes.glyphs;
    this.noteText = ko.observable(text);
    this.noteGlyphs = ko.observableArray(glyphs);

    this.roadbook = roadbook;

    var _this = this;
    var angle = wptJson.angles.relativeAngle;
    var json = wptJson.tulipJson
    ko.bindingHandlers.waypointCanvasRendered = {
      init: function(element){
        _this.initTulip(element, angle, json);
        _this.initWaypointListeners($(element).parents('.waypoint'));
      }
    };
  },

  addNoteGlyph: function(src){
    if(this.noteGlyphs().length < 3 ){
      this.noteGlyphs.push({src: src});
    }
  },

  removeLastNoteGlyph: function(){
    this.noteGlyphs.pop();
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

  initWaypointListeners: function(element){
    var _this = this;
    $(element).click(function(e){
      if(_this.roadbook.requestWaypointEdit(_this)){
        _this.tulip.beginEdit(); //TODO we need to have some sort of event handling, maybe check if it is default track, track, or glyph, and assign the proper editor
      }
      // app.mapEditor.map.setCenter(latLng); TODO center the map on the rwaypoints lat/long
      $('#roadbook-waypoints').children().hide();
      $(element).show();
      $('#waypoint-palette').show();
    });
  },

  serializeTulip: function() {
    return this.tulip.serialize();
  },

  tulipPNG: function(){
    return this.tulip.toPNG();
  },
});
