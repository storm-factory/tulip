/*
  NOTE this class uses ES6 class syntax which is how all other classes should be rewriteen moving forward
*/
'use strict';
class Track{
  /*

    angle = INT between 0 & 359
    type = STRING <offPise,track,road,mainRoad,dcw>
    canvas = HTML_CANVAS to render track on
  */
  constructor(){
    this.types = {};
    this.initTypes();
  }

  addGroupToCanvas(group, canvas){
    Track.disableDefaults(group);
    canvas.add(group);
    return group;
  }

  buildPath(angle,type='track'){
    return new fabric.Path(this.buildTrackPathString(angle),this.types[type]);
  }

  /*
    Creates an SVG string form the assumption that we are originating at the point (90,90) and vectoring out from there at a given angle
    The angle is provided from the mapping module.
  */
  buildTrackPathString(angle) {
    var set1 = this.buildPathSet([9,18,27],angle)
    var set2 = this.buildPathSet([36,45,54],angle)
    var set3 = this.buildPathSet([63,72,81],angle)
    return 'M 90 90 C '+ set1[0][0] +', '+ set1[0][1] +', '+ set1[1][0] +', '+ set1[1][1] +', '+ set1[2][0] +', '+ set1[2][1]
                        + ' C '+ set2[0][0] +', '+ set2[0][1] +', '+ set2[1][0] +', '+ set2[1][1] +', '+ set2[2][0] +', '+ set2[2][1]
                        + ' C '+ set3[0][0] +', '+ set3[0][1] +', '+ set3[1][0] +', '+ set3[1][1] +', '+ set3[2][0] +', '+ set3[2][1];
  }

  /*
    creates a 2D array of point pairs which describe where a set of points in the track path string should be
    given an angle and a set of 3 maginitudes describing the desired location of key points in the path
  */
  buildPathSet(magnitudes, angle){
    var set = [];
    for(var i=0;i<magnitudes.length;i++){
      var xy = this.rotatePoint(magnitudes[i],angle);
      set.push(xy);
    }
    return set;
  }

  /*
    The canvas is a 180px by 180px box with (0,0) being the top left corner. The origin of the exit track is at the point (90,90)

    The mapping module returns the angle of the turn with a positive value if it's a right turn and a negative value if it's a left turn

    This function takes a magnitude of a vector from a typical cartesian system with an origin of (0,0) and rotates that by the specified angle.
    (In other words, the y component of a vector which originates at the origin and parallels the y axis tending to infinity.)
    It then transforms the (x,y) components of the vector back to the weird (90,90) origin system and returns them as an array.
  */
  rotatePoint(magnitude,angle){

    //convert to radians
    angle = angle * (Math.PI / 180);

    var x = Math.round(magnitude * (Math.sin(angle)));
    var y = -Math.round(magnitude * (Math.cos(angle)));

    return [x + 90, y + 90]
  }

  static disableDefaults(object){
    object.hasBorders    = false;
    object.selectable    = false;
    object.hasControls   = false;
    object.lockMovementX = true;
    object.lockMovementY = true;
  }

  initTypes(){

    this.types.offPiste = [{
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 5,
                                    strokeDashArray: [10, 5],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  }];
    this.types.track = [{
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 5,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  }];
    this.types.road = [{
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 8,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  }];

    this.types.mainRoad = [{
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 8,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  },
                                  {
                                    fill: '',
                                    stroke: '#fff',
                                    strokeWidth: 6,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  }];
  }
}

class EntryTrack extends Track {
  constructor(type, canvas){
    super();
    this.types = {};
    this.initTypes();
    this.objectsOnCanvas = this.build(type, canvas);
  }

  build(type='track',canvas) {
    var path = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90',this.types[type]);
    var point = new fabric.Circle({
      left: path.path[0][1],
      top: path.path[0][2],
      strokeWidth: 1,
      radius: 7,
      fill: '#000',
      stroke: '#666',
    });

    var group = new fabric.Group([point,path]);
    return this.addGroupToCanvas(group, canvas);
  }
}

class ExitTrack extends Track {
  constructor(angle,type, canvas){
    super();
    this.objectsOnCanvas = this.buildPath(angle,type, canvas);
  }

  buildPath(angle,type, canvas){
    var path = super.buildPath(angle, type)//new fabric.Path(this.buildTrackPathString(angle),this.types[type]);
    var point = new fabric.Triangle({
      left: path.path[3][5],
      top: path.path[3][6],
      strokeWidth: 1,
      height: 15,
      width: 15,
      fill: '#000',
      stroke: '#666',
      angle: angle,
    });

    var group = new fabric.Group([point,path]);
    return this.addGroupToCanvas(group, canvas);
  }
}

class AddedTrack extends Track {
  constructor(angle,type, canvas){
    super();
    var group = new fabric.Group([this.buildPath(angle,type)]);
    this.objectsOnCanvas = group;
    this.addGroupToCanvas(group, canvas);
  }

}
