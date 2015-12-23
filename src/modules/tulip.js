/*
  This sumbitch should be able to load from a canvas when that particular canvas enters edit mode.
  It should load shit from svg files in the assests directory and allow them to be placed on and edited in the canvas.
*/

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function(el, json, angle){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.objects = [];
    this.currentlyEditingObjects = [];
    this.initTracks(angle);
    // this.initListeners();
  },

  initTracks: function(angle){
    this.entryTrack = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 88',
                                              { fill: '',
                                                stroke: '#000',
                                                strokeWidth: 5,
                                                hasControls: false,
                                                lockMovementX: true,
                                                lockMovementY: true,
                                                hasBorders: false
                                              });
    this.entryTrackOrigin = new fabric.Circle({
      left: this.entryTrack.path[0][1],
      top: this.entryTrack.path[0][2],
      strokeWidth: 1,
      radius: 5,
      fill: '#000',
      stroke: '#666',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });
    this.entryTrackOrigin.track = this.entryTrack;
    this.entryTrack.origin = this.entryTrackOrigin;
    this.entryTrack.objectType = 'track'


    this.canvas.add(this.entryTrack);
    this.canvas.add(this.entryTrackOrigin);

    this.exitTrack = new fabric.Path(this.buildExitTrackPathString(angle),
                                              { fill: '',
                                              stroke: '#000',
                                              strokeWidth: 5,
                                              hasControls: false,
                                              lockMovementX: true,
                                              lockMovementY: true,
                                              hasBorders: false
                                            });



    this.exitTrackEnd = new fabric.Triangle({
      left: this.exitTrack.path[3][5],
      top: this.exitTrack.path[3][6],
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
    this.exitTrackEnd.track = this.exitTrack
    this.exitTrack.end = this.exitTrackEnd;
    this.exitTrack.objectType = 'track'

    this.canvas.add(this.exitTrack);
    this.canvas.add(this.exitTrackEnd);

    this.objects.push(this.exitTrack);
    this.objects.push(this.exitTrackEnd);
    this.objects.push(this.entryTrack);
    this.objects.push(this.entryTrackOrigin);
  },

  beginEdit: function() {

    for(i = 0; i < this.objects.length; i++) {
      if(this.objects[i].objectType == 'track'){
        if(this.objects[i] == this.entryTrack){
          this.currentlyEditingObjects.push(new TrackEditor(this.canvas, this.entryTrack,true, false));
        }
        if(this.objects[i] == this.exitTrack){
          this.currentlyEditingObjects.push(new TrackEditor(this.canvas, this.exitTrack,false, true));
        }
      }
    }
  },

  finishEdit: function() {

  },

  /*
    Creates an SVG string form the assumption that we are originating at the point (90,90) and vectoring out from there at a given angle
    the angles is provided from the mapping module.
  */
  buildExitTrackPathString: function(angle) {

    // TODO this is some error with angle reporting when the track is at a certain point
    console.log(angle);

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
  }

});
