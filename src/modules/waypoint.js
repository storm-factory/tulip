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
    this.lat = ko.observable(wptJson.lat);
    this.lng = ko.observable(wptJson.lng);

    this.distFromPrev   = ko.computed(this.computedDistanceFromPrev, this);
    this.totalDistance  = ko.computed(this.computedTotalDistance, this);
    this.heading        = ko.computed(this.computedHeading, this);

    this.entryTrackType = wptJson.entryTrackType == undefined ? 'track' : wptJson.entryTrackType;
    this.exitTrackType = wptJson.exitTrackType == undefined ? 'track' : wptJson.exitTrackType;

    // waypoints don't get any note info when they are added via UI so intialize them to blank
    var text = wptJson.notes == undefined ? '' : wptJson.notes.text;
    var glyphs = wptJson.notes == undefined ? [] : wptJson.notes.glyphs;
    this.noteText = ko.observable(text);
    this.noteGlyphs = ko.observableArray(glyphs);

    this.roadbook = roadbook;
    this.mapVertexIndex = wptJson.mapVertexIndex == undefined ? null : wptJson.mapVertexIndex;

    var _this = this;
    var angle = wptJson.angles.relativeAngle;
    var json = wptJson.tulipJson;
    var trackTypes = {entryTrackType: this.entryTrackType, exitTrackType: this.exitTrackType};
    ko.bindingHandlers.waypointCanvasRendered = {
      init: function(element){
        _this.initTulip(element, angle, trackTypes, json);
        _this.initWaypointListeners($(element).parents('.waypoint'));
        _this.element = $(element).parents('.waypoint');
      }
    };
  },

  addNoteGlyph: function(src){
    if(this.noteGlyphs().length < 3 ){
      this.noteGlyphs.push({src: src});
    }
  },

  changeAddedTrackType(type){
    this.tulip.changeAddedTrackType(type)
  },

  changeEntryTrackType(type){
    this.entryTrackType = type;
    this.tulip.changeEntryTrackType(type)
  },

  changeExitTrackType(type){
    this.exitTrackType = type;
    this.tulip.changeExitTrackType(type)
  },

  removeLastNoteGlyph: function(){
    this.noteGlyphs.pop();
  },

  initTulip: function(element, angle, trackTypes, json){
    this.tulip = new Tulip(element, angle, trackTypes, json);
  },

  updateWaypoint: function (distances, heading, latLng, mapVertexIndex){
    if(distances){
      this.kmFromStart(distances.kmFromStart);
      this.kmFromPrev(distances.kmFromPrev);
    }
    if(heading){
      this.exactHeading(heading);
    }
    if(latLng){
      this.lat(latLng.lat);
      this.lng(latLng.lng);
    }
    if(mapVertexIndex) {
      this.mapVertexIndex = mapVertexIndex
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
        _this.tulip.beginEdit();
      }
      var latLng = new google.maps.LatLng(_this.lat(), _this.lng());
      // TODO this needs to be refactored to
      //  app.setMapCenter ...
      //  app.setMapZoom ...
      app.mapEditor.map.setCenter(latLng);
      app.mapEditor.map.setZoom(18);

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
