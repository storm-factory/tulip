/*
  TODO make this a model for track objects using the track editor as the controller and the tulip as the view
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

  addObjectsToCanvas(objectsArray, canvas){
    if(objectsArray.length){
      for(var i=0;i<objectsArray.length;i++){
        Track.disableDefaults(objectsArray[i]);
        canvas.add(objectsArray[i]);
      }
    }
  }

  buildTrackPaths(angle,origin,type){
    type = (type !== undefined ? type : 'track')
    var paths = [];
    var typeOptions = this.types[type];
    for(var i=0;i<typeOptions.length;i++){
      paths.push(new fabric.Path(this.buildTrackPathString(angle,origin),typeOptions[i]));
    }
    return paths;
  }

  /*
    Creates an SVG Cubic Bezier Curve string from a passed in origin (generally [90,90]) and vectoring out from there at a given angle
    The angle is provided from the mapping module. We create the curve in a straight line, but UI interaction will move the control points
    and produce a smooth Cubic Bezier
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
                                    strokeWidth: 4,
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
                                    strokeWidth: 4,
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
                                    strokeWidth: 6,
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
                                    strokeWidth: 6,
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
                                    strokeWidth: 4,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  }];
    this.types.dcw = [{
                                    fill: '',
                                    stroke: '#000',
                                    strokeWidth: 10,
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
                                    stroke: '#000',
                                    strokeWidth: 2,
                                    strokeDashArray: [],
                                    hasControls: false,
                                    lockMovementX: true,
                                    lockMovementY: true,
                                    hasBorders: false,
                                    selectable:false,
                                  }];
  }

  changeType(type,canvas){
    var pathSVG = $(this.paths[0].toSVG()).attr('d')
    this.clearPathsFromCanvas(canvas);
    var typeOptions = this.types[type];
    this.setPaths(pathSVG, typeOptions, canvas);
  }

  setPaths(svg, typeOptions, canvas){
    for(var i=0;i<typeOptions.length;i++){
      var path = new fabric.Path(svg,typeOptions[i])
      canvas.add(path);
      this.paths.push(path);
    }
  }

  clearPathsFromCanvas(canvas){
    for(var i=0;i<this.paths.length;i++){
      canvas.remove(this.paths[i]);
    }
    // clear out old values
    this.paths.length = 0;
  }
}

class EntryTrack extends Track {
  constructor(type,canvas,objects){
    super();
    if(objects){
      this.origin = objects.origin
      this.paths = objects.paths
    }else {
      this.buildTrackObjects(type, canvas);
    }

  }

  buildTrackObjects(type,canvas) {
    type = (type !== undefined ? type : 'track');
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

  changeType(type,canvas){
    super.changeType(type,canvas);
    this.origin.bringToFront();
  }
}

class ExitTrack extends Track {
  constructor(angle,type,canvas,objects){
    super();
    if(objects){
      this.end = objects.end
      this.paths = objects.paths
    }else {
      this.buildTrackObjects(angle,type, canvas);
    }
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
    canvas.remove(this.end);
    for(var i=0;i<this.paths.length;i++){
      canvas.remove(this.paths[i]);
    }

    this.buildTrackObjects(angle,type, canvas);
  }

  changeType(type,canvas){
    super.changeType(type,canvas);
    this.end.bringToFront();
  }
}

class AddedTrack extends Track {
  constructor(angle,type,canvas,objects){
    super();
    if(objects){
      Track.disableDefaults(objects.track[0])
      this.paths = objects.track
    }else {
      this.paths = this.buildTrackPaths(angle,[90,90],type)
      for(var i=0;i<this.paths.length;i++){
        canvas.add(this.paths[i]);
      }
    }
  }

}

/*
  Node exports for test suite
*/
// module.exports.track = Track;
// module.exports.disableDefaults = Track.disableDefaults;
