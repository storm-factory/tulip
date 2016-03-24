/*
  Creates a tulip canvas object from either UI interaction or the loading of a saved file
*/

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function(el, angle, json){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    //----------------------- NOT YET IMPLIMENTED
    this.paths = [];
    this.glyphs = [];
    //-----------------------
    this.activeEditors = [];
    this.initTulip(angle,json);
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
    TODO test this doesn't break under UI wpt creation
  */
  initTulip: function(angle,json){
    if(json !== undefined && angle == 0){ //the map point has been created from serialized json
      this.buildFromJson(json);
    } else if(angle !== undefined){
      this.buildEntry();
      this.buildExit(angle);
    }
  },

  initEntry: function(point, path){
    this.entryTrackOrigin = point;
    this.entryTrack = path;
    this.entryTrackOrigin.track = this.entryTrack;
    this.entryTrack.origin = this.entryTrackOrigin;
  },
  initExit: function(point, path){
    this.exitTrack = path;
    this.exitTrackEnd = point;
    this.exitTrackEnd.track = this.exitTrack
    this.exitTrack.end = this.exitTrackEnd;
  },
  /*
    Builds the tulip from passed in JSON
  */
  buildFromJson: function(json){
    // TODO merge in paths array and glyphs array and keep track of how to handle them based on their index in the below objects array in the json object
    var json = {
      "objects": [json.entry.point, json.entry.path, json.exit.path, json.exit.point]
    };
    var obs = [];

    this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas), function(o, object) {
      obs.push(object);
    });

    this.initEntry(obs[0], obs[1]);
    this.initExit(obs[3], obs[2]);
  },

  buildEntry: function() {

    var entry = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90',
                                              { fill: '',
                                                stroke: '#000',
                                                strokeWidth: 5,
                                                hasControls: false,
                                                lockMovementX: true,
                                                lockMovementY: true,
                                                hasBorders: false
                                              });
    var point = new fabric.Circle({
      left: entry.path[0][1],
      top: entry.path[0][2],
      strokeWidth: 1,
      radius: 5,
      fill: '#000',
      stroke: '#666',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });

    this.initEntry(point, entry);
    this.canvas.add(this.entryTrack);
    this.canvas.add(this.entryTrackOrigin)
  },

  buildExit: function(angle){
    var exit = new fabric.Path(this.buildExitTrackPathString(angle),
                                              { fill: '',
                                              stroke: '#000',
                                              strokeWidth: 5,
                                              hasControls: false,
                                              lockMovementX: true,
                                              lockMovementY: true,
                                              hasBorders: false
                                            });
    var point = new fabric.Triangle({
      left: exit.path[3][5],
      top: exit.path[3][6],
      strokeWidth: 1,
      height: 12,
      width: 12,
      fill: '#000',
      stroke: '#666',
      angle: angle,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });

    this.initExit(point, exit);
    this.canvas.add(this.exitTrack);
    this.canvas.add(this.exitTrackEnd);
  },


  /*
    TODO have different handlers for default paths (entry and exit) and ad hoc created objects and glyphs
  */
  beginEdit: function() {
    this.activeEditors.push(new TulipEditor(this.canvas, this.entryTrack,true, false));
    this.activeEditors.push(new TulipEditor(this.canvas, this.exitTrack,false, true));
  },

  finishEdit: function() {
    for(i = 0; i < this.activeEditors.length; i++) {
      this.activeEditors[i].destroy();
    }
    this.activeEditors = [];
  },

  /*
    Creates an SVG string form the assumption that we are originating at the point (90,90) and vectoring out from there at a given angle
    the angles is provided from the mapping module.
  */
  buildExitTrackPathString: function(angle) {

    var xy1 =  this.rotatePoint(9,angle);
    var xy2 =  this.rotatePoint(18,angle);
    var xy3 =  this.rotatePoint(27,angle);
    var set1 = [[xy1[0], xy1[1]],[xy2[0], xy2[1]],[xy3[0], xy3[1]]];

    xy1 =  this.rotatePoint(36,angle);
    xy2 =  this.rotatePoint(45,angle);
    xy3 =  this.rotatePoint(54,angle);
    var set2 = [[xy1[0], xy1[1]],[xy2[0], xy2[1]],[xy3[0], xy3[1]]];

    xy1 =  this.rotatePoint(63,angle);
    xy2 =  this.rotatePoint(72,angle);
    xy3 =  this.rotatePoint(81,angle);
    var set3 = [[xy1[0], xy1[1]],[xy2[0], xy2[1]],[xy3[0], xy3[1]]];

    var trackString = 'M 90 90 C '+ set1[0][0] +', '+ set1[0][1] +', '+ set1[1][0] +', '+ set1[1][1] +', '+ set1[2][0] +', '+ set1[2][1]
                        + ' C '+ set2[0][0] +', '+ set2[0][1] +', '+ set2[1][0] +', '+ set2[1][1] +', '+ set2[2][0] +', '+ set2[2][1]
                        + ' C '+ set3[0][0] +', '+ set3[0][1] +', '+ set3[1][0] +', '+ set3[1][1] +', '+ set3[2][0] +', '+ set3[2][1]

    return trackString;
  },

  /*
    The canvas is a 180px by 180px box with (0,0) being the top left corner. The origin of the exit track is at the point (90,90)

    The mapping module returns the angle of the turn with a positive value if it's a right turn and a negative value if it's a left turn

    This function takes a magnitude of a vector from a typical cartesian system with an origin of (0,0) and rotates that by the specified angle.
    (In other words, the y component of a vector which originates at the origin and parallels the y axis.)
    It then transforms the (x,y) components of the vector back to the weird (90,90) origin system and returns them as an array.
  */
  rotatePoint: function(magnitude,angle){

    var a = angle;
    angle = angle * (Math.PI / 180); //convert to radians
    //q1
    if(0 > a && a >= -90){
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }
    //q2
    if(-90 > a && a >= -180){
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }
    //q3
    if(90 < a && a <= 180){
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }
    //q4
    if(0 <= a && a <= 90) {
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }

    return [x + 90, y + 90]
  },

  /*
    Build the Canvas object from a json string
  */
  loadFromJson: function(json){

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
      exit: {
        point: this.exitTrackEnd,
        path: this.exitTrack
      },
      paths: [],
      glyphs: [],
    };
    return json;
  }

});
