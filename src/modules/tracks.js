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
  }

  addObjectsToCanvas(objectsArray, canvas){
    if(objectsArray.length){
      for(var i=0;i<objectsArray.length;i++){
        Track.disableDefaults(objectsArray[i]);
        canvas.add(objectsArray[i]);
      }
    }
  }

  buildTrackPaths(angle,origin,type='track'){
    var paths = [];
    var typeOptions = this.types[type];
    for(var i=0;i<typeOptions.length;i++){
      paths.push(new fabric.Path(this.buildTrackPathString(angle,origin),typeOptions[i]));
    }
    return paths;
  }

  /*
    Creates an SVG string form the assumption that we are originating at the point (90,90) and vectoring out from there at a given angle
    The angle is provided from the mapping module.
  */
  buildTrackPathString(angle,origin) {
    var set1 = this.buildTrackPathsSet([9,18,27],angle,origin)
    var set2 = this.buildTrackPathsSet([36,45,54],angle,origin)
    var set3 = this.buildTrackPathsSet([63,72,81],angle,origin)
    return 'M '+ origin[0] + ' ' + origin[1] +' C '+ set1[0][0] +', '+ set1[0][1] +', '+ set1[1][0] +', '+ set1[1][1] +', '+ set1[2][0] +', '+ set1[2][1]
                        + ' C '+ set2[0][0] +', '+ set2[0][1] +', '+ set2[1][0] +', '+ set2[1][1] +', '+ set2[2][0] +', '+ set2[2][1]
                        + ' C '+ set3[0][0] +', '+ set3[0][1] +', '+ set3[1][0] +', '+ set3[1][1] +', '+ set3[2][0] +', '+ set3[2][1];
  }

  /*
    creates a 2D array of point pairs which describe where a set of points in the track path string should be
    given an angle and a set of 3 maginitudes describing the desired location of key points in the path
  */
  buildTrackPathsSet(magnitudes, angle, origin){
    var set = [];
    for(var i=0;i<magnitudes.length;i++){
      var xy = this.rotatePoint(magnitudes[i],angle, origin);
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
  rotatePoint(magnitude,angle, origin){

    //convert to radians
    angle = angle * (Math.PI / 180);

    var x = Math.round(magnitude * (Math.sin(angle)));
    var y = -Math.round(magnitude * (Math.cos(angle)));

    return [x + origin[0], y + origin[1]]
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

  changeType(type) {
    var pathSVG = $(this.objectsOnCanvas.getObjects('path')[0].toSVG()).attr('d')
    var paths = this.objectsOnCanvas.getObjects('path');
    for(var i=0;i<paths.length;i++){
      this.objectsOnCanvas.remove(paths[i]);
    }

    var typeOptions = this.types[type];
    for(var i=0;i<typeOptions.length;i++){
      this.objectsOnCanvas.addWithUpdate(new fabric.Path(pathSVG,typeOptions[i]));
    }
  }
}

class EntryTrack extends Track {
  constructor(type,canvas){
    super();
    this.buildTrackObjects(type, canvas);
  }

  buildTrackObjects(type='track',canvas) {
    var paths = super.buildTrackPaths(0,[90,171], type)
    var point = new fabric.Circle({
      left: paths[0].path[0][1],
      top: paths[0].path[0][2],
      strokeWidth: 1,
      radius: 7,
      fill: '#000',
      stroke: '#666',
    });
    this.origin = point;
    this.paths = paths;
    var objects = paths.concat(point);
    this.addObjectsToCanvas(objects, canvas);
  }

  changeType(type){
    super.changeType(type);
    // this.objectsOnCanvas.getObjects('circle')[0].bringToFront();
    // Track.disableDefaults(this.objectsOnCanvas.getObjects('circle')[0]);
  }
}

class ExitTrack extends Track {
  constructor(angle,type,canvas){
    super();
    this.buildTrackObjects(angle,type, canvas);
  }

  buildTrackObjects(angle, type, canvas){
    var paths = super.buildTrackPaths(angle,[90,90], type)
    var point = new fabric.Triangle({
      left: paths[0].path[3][5],
      top: paths[0].path[3][6],
      strokeWidth: 1,
      height: 15,
      width: 15,
      fill: '#000',
      stroke: '#666',
      angle: angle,
    });
    this.end = point;
    this.paths = paths
    var objects = paths.concat(point);
    this.addObjectsToCanvas(objects, canvas);
  }

  changeAngle(angle, type, canvas) {
    // canvas.remove(this.objectsOnCanvas);
    // this.objectsOnCanvas = this.buildTrackPaths(angle, type, canvas)
  }

  changeType(type){
    super.changeType(type);
    // this.objectsOnCanvas.getObjects('triangle')[0].bringToFront();
    // Track.disableDefaults(this.objectsOnCanvas.getObjects('triangle')[0]);
  }
}

class AddedTrack extends Track {
  constructor(angle,type, canvas){
    super();
    var group = new fabric.Group(this.buildTrackPaths(angle,[90,90],type));
    this.objectsOnCanvas = group;
    this.addGroupToCanvas(group, canvas);
  }

}
