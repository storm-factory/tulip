/*
  Creates a tulip canvas object from either UI interaction or the loading of a saved file
*/
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function(el, angle, trackTypes, json){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.canvas.hoverCursor = 'pointer';

    this.tracks = [];
    this.glyphs = [];
    this.activeEditors = [];
    this.activeRemovers = [];
    this.trackTypes = {};
    this.addedTrackType = 'track';
    this.exitTrackUneditedPath = true;
    this.initTrackTypes();
    this.initTulip(angle, trackTypes, json);
  },

  clear: function(){
    this.canvas.clear();
    this.entryTrack = null;
    this.entryTrackOrigin = null;
    this.exitTrack = null;
    this.exitTrackEnd = null;
  },

  /*
    Creates a tulip either from passed in json from a file load or from a angle provided by UI wpt creation
  */
  initTulip: function(angle, trackTypes,json){
    if(json !== undefined && angle == undefined){ //the map point has been created from serialized json
      this.buildFromJson(json);
    } else if(angle !== undefined && trackTypes !== undefined){
      this.buildEntry(trackTypes.entryTrackType);
      this.buildExit(angle,trackTypes.exitTrackType);
    }
  },

  initEntry: function(point, path){
    this.entryTrackOrigin = point;
    this.entryTrack = path;

    this.disablePointDefaults(this.entryTrackOrigin);
    this.disablePathDefaults(this.entryTrack);

    this.entryTrackOrigin.track = this.entryTrack;
    this.entryTrack.origin = this.entryTrackOrigin;
  },

  initExit: function(point, path){
    this.exitTrackEnd = point;
    this.exitTrack = path;

    this.disablePointDefaults(this.exitTrackEnd);
    this.disablePathDefaults(this.exitTrack);

    this.exitTrackEnd.track = this.exitTrack;
    this.exitTrack.end = this.exitTrackEnd;
  },

  disablePointDefaults: function(point){
    point.hasBorders    = false;
    point.selectable    = false;
    point.hasControls   = false;
    point.lockMovementX = true;
    point.lockMovementY = true;
  },

  disablePathDefaults: function(path){
    path.hasBorders    = false;
    path.hasControls   = false;
    path.selectable    = false;
    path.lockMovementX = true;
    path.lockMovementY = true;
  },

  initTracks: function(trackArray){
    this.tracks = trackArray;
    for(i=0;i<this.tracks.length;i++){
      this.disablePathDefaults(this.tracks[i]);
    }
  },

  initTrackTypes: function(){

    this.trackTypes.offPiste = {
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 5,
                                    strokeDashArray: [10, 5],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  };
    this.trackTypes.track = {
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 5,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  };
    this.trackTypes.road = {
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 8,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  };
  },

  /*
    Adds a track to tulip from UI interaction
  */
  addTrack: function(angle) {
    this.finishRemove();
    var track = new fabric.Path(this.buildTrackPathString(angle),this.trackTypes[this.addedTrackType]);
    this.tracks.push(track);
    this.canvas.add(track);
    this.activeEditors.push(new TrackEditor(this.canvas, track, true, true, false));
    //NOTE this solves the problem of having overlapping handles if a control is clicked twice or things get too close to one another.
    //     an alternate solution that may solve any performance issues this might cause is to loop through the active editors and bring all the
    //     hangles to the front.
    this.finishEdit();
    this.beginEdit();
  },

  addGlyph: function(position,uri){
    this.finishRemove();
    var _this = this;
    var position = position;
    var imgObj = new Image();
    imgObj.src = uri;
    imgObj.onload = function () {
      var image = new fabric.Image(imgObj);
      image.top = position.top;
      image.left = position.left;
      image.scaleToWidth(75);
      _this.canvas.add(image);
      _this.glyphs.push(image);
    }
  },
  /*
    Builds the tulip from passed in JSON
  */
  buildFromJson: function(json){

    this.exitTrackUneditedPath = json.exitTrackUneditedPath !== undefined ? json.exitTrackUneditedPath : true;
    var _this = this;
    var numTracks = json.tracks.length;
    // build a propperly formatted json string to import

    var json = {
      "objects": [json.entry.point, json.entry.path, json.exit.path, json.exit.point].concat(json.tracks).concat(json.glyphs),
    };
    var obs = [];

    this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas), function(o, object) {
      obs.push(object);
      if(object.type == "image"){
          //if the object is an image add it to the glyphs array
          _this.glyphs.push(object);
      }
    });

    // TODO because the below are each requiring their own comment section means they could refactor into their own functions
    /*
      Default Tracks
    */
    this.initEntry(obs[0], obs[1]);
    this.initExit(obs[3], obs[2]);

    /*
      Aux tracks
    */
    // slice and dice obs
    if(numTracks > 0){
      var tracks = obs.slice(4, 4 + numTracks);
      this.initTracks(tracks);
    }
  },

  buildEntry: function(type='track') {

    var entry = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90',this.trackTypes[type]);
    var point = new fabric.Circle({
      left: entry.path[0][1],
      top: entry.path[0][2],
      strokeWidth: 1,
      radius: 7,
      fill: '#000',
      stroke: '#666',
    });

    this.initEntry(point, entry);
    this.canvas.add(this.entryTrack);
    this.canvas.add(this.entryTrackOrigin)
  },

  buildExit: function(angle,type='track'){

    var exit = new fabric.Path(this.buildTrackPathString(angle),this.trackTypes[type]);
    var point = new fabric.Triangle({
      left: exit.path[3][5],
      top: exit.path[3][6],
      strokeWidth: 1,
      height: 15,
      width: 15,
      fill: '#000',
      stroke: '#666',
      angle: angle,
    });

    this.initExit(point, exit);
    this.canvas.add(this.exitTrack);
    this.canvas.add(this.exitTrackEnd);
  },


  beginEdit: function() {
    this.uneditedPath = $(this.exitTrack.toSVG()).attr('d');
    this.activeEditors.push(new TrackEditor(this.canvas, this.entryTrack,true, false, true));
    this.activeEditors.push(new TrackEditor(this.canvas, this.exitTrack ,false, true, true));
    for(i=0;i<this.tracks.length;i++){
      this.activeEditors.push(new TrackEditor(this.canvas, this.tracks[i],true, true, false));
    }
  },

  beginRemoveGlyph: function(){
    this.finishEdit();
    for(i=0;i<this.glyphs.length;i++){
      this.activeRemovers.push(new GlyphRemover(this, this.glyphs[i],i));
    }
  },

  beginRemoveTrack: function(){
    this.finishEdit();
    for(i=0;i<this.tracks.length;i++){
      this.activeRemovers.push(new TrackRemover(this, this.tracks[i],i));
    }
  },

  /*
    Creates an SVG string form the assumption that we are originating at the point (90,90) and vectoring out from there at a given angle
    The angle is provided from the mapping module.
  */
  buildTrackPathString: function(angle) {

    var set1 = this.buildPathSet([9,18,27],angle)
    var set2 = this.buildPathSet([36,45,54],angle)
    var set3 = this.buildPathSet([63,72,81],angle)
    var trackString = 'M 90 90 C '+ set1[0][0] +', '+ set1[0][1] +', '+ set1[1][0] +', '+ set1[1][1] +', '+ set1[2][0] +', '+ set1[2][1]
                        + ' C '+ set2[0][0] +', '+ set2[0][1] +', '+ set2[1][0] +', '+ set2[1][1] +', '+ set2[2][0] +', '+ set2[2][1]
                        + ' C '+ set3[0][0] +', '+ set3[0][1] +', '+ set3[1][0] +', '+ set3[1][1] +', '+ set3[2][0] +', '+ set3[2][1]

    return trackString;
  },

  /*
    creates a 2D array of point pairs which describe where a set of points in the track path string should be
    given an angle and a set of 3 maginitudes describing the desired location of key points in the path
  */
  buildPathSet: function(magnitudes, angle){
    var set = [];
    for(var i=0;i<magnitudes.length;i++){
      var xy = this.rotatePoint(magnitudes[i],angle);
      set.push(xy);
    }
    return set;
  },

  changeAddedTrackType(type){
    this.addedTrackType = type
  },

  changeEntryTrackType(type){
    this.entryTrack.setOptions(this.trackTypes[type])
    this.entryTrackType = type;
    this.canvas.renderAll();
  },

  changeExitTrackType(type){
    this.exitTrack.setOptions(this.trackTypes[type])
    this.exitTrackType = type
    this.canvas.renderAll();
  },

  changeExitAngle(angle){
    if(this.exitTrackUneditedPath){
      if((this.uneditedPath == $(this.exitTrack.toSVG()).attr('d')) && (app.roadbook.currentlyEditingWaypoint != null)){
        this.redrawExitAndEditor(angle);
      }else if(this.uneditedPath == $(this.exitTrack.toSVG()).attr('d') || this.uneditedPath == null) {
        this.redrawExit(angle)
      }
    }
  },

  finishEdit: function() {
    for(var i = 0; i < this.activeEditors.length; i++) {
      this.activeEditors[i].destroy();
    }
    this.activeEditors = [];

    //TODO move this to it's own function
    if(this.uneditedPath != $(this.exitTrack.toSVG()).attr('d')){
      this.exitTrackUneditedPath = false;
    }
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.deactivateAll().renderAll();
  },

  finishRemove: function(){
    for(var i = 0;i <this.activeRemovers.length;i++){
      this.activeRemovers[i].destroy();
    }
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.deactivateAll().renderAll();
  },

  redrawExit(angle){
    this.canvas.remove(this.exitTrack);
    this.canvas.remove(this.exitTrackEnd);
    this.buildExit(angle,this.exitTrackType);
    if(this.uneditedPath != null){
      this.uneditedPath = $(this.exitTrack.toSVG()).attr('d');
    }
  },

  redrawExitAndEditor(angle){
    this.activeEditors[1].destroy();
    this.redrawExit(angle)
    this.activeEditors.splice(1,0,(new TrackEditor(this.canvas, this.exitTrack ,false, true, true)));
  },

  removeLastGlyph: function(){
    var glyph = this.glyphs.pop()
    this.canvas.remove(glyph);
  },

  removeLastTrack: function(){
    var track = this.tracks.pop()
    this.canvas.remove(track);
    for(i = 0; i < this.activeEditors.length; i++) {
      if(this.activeEditors[i].track == track){
        this.activeEditors[i].destroy();
      }
    }
  },

  /*
    The canvas is a 180px by 180px box with (0,0) being the top left corner. The origin of the exit track is at the point (90,90)

    The mapping module returns the angle of the turn with a positive value if it's a right turn and a negative value if it's a left turn

    This function takes a magnitude of a vector from a typical cartesian system with an origin of (0,0) and rotates that by the specified angle.
    (In other words, the y component of a vector which originates at the origin and parallels the y axis tending to infinity.)
    It then transforms the (x,y) components of the vector back to the weird (90,90) origin system and returns them as an array.
  */
  rotatePoint: function(magnitude,angle){

    //convert to radians
    angle = angle * (Math.PI / 180);

    var x = Math.round(magnitude * (Math.sin(angle)));
    var y = -Math.round(magnitude * (Math.cos(angle)));

    return [x + 90, y + 90]
  },

  /*
    return the canvas object as JSON so it can be persisted
  */
  serialize: function(){
    var json = {
      entry: {
        point: this.entryTrackOrigin,
        path: this.entryTrack
      },
      exitTrackUneditedPath: this.exitTrackUneditedPath,
      exit: {
        point: this.exitTrackEnd,
        path: this.exitTrack
      },
      tracks: this.tracks,
      glyphs: this.serializeGlyphs(),
    };
    return json;
  },

  serializeGlyphs: function(){
    var glyphsJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    for(glyph of this.glyphs) {
      var json = glyph.toJSON()
      json.src = this.truncateGlyphSource(json.src);
      glyphsJson.push(json);
    }
    return glyphsJson;
  },

  toPNG: function(){
    return this.canvas.toDataURL();
  },

  truncateGlyphSource: function(src){
    var index = src.lastIndexOf("assets/svg/glyphs");
    return "./" + src.slice(index);
  }

});
