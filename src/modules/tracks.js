/*
  TODO make this a model for track objects using the track editor as the controller and the tulip as the view
*/
'use strict';
class Track {
  /*

    angle = INT between 0 & 359
    type = STRING <lowVisTrack,offPiste,track,road,mainRoad,dcw>
    canvas = HTML_CANVAS to render track on
  */
  constructor(id = null) {
    const canvas_width = 180;
    const canvas_height = 180;
    this.mainTrackColor = '#22F';
    this.trackColor = '#000';
    this.canvas_center = [canvas_width / 2, canvas_height / 2];
    this.entry_track_origin = [canvas_width / 2, canvas_height - 10]
    this.types = {};
    this.initTypes();
    this.id = id ? id : globalNode.randomUUID();
  }

  addObjectsToCanvas(objectsArray, canvas) {
    if (objectsArray.length) {
      for (var i = 0; i < objectsArray.length; i++) {
        Track.disableDefaults(objectsArray[i]);
        canvas.add(objectsArray[i]);
      }
    }
  }

  buildTrackPaths(angle, origin, type, mainTrack = false, path = null) {
    type = (type !== undefined ? type : 'track')
    var paths = [];
    var typeOptions = this.getTypeOptions(type || 'track');
    if (mainTrack) {
      typeOptions = typeOptions.map(obj => {
        if (obj.stroke === this.trackColor) {
          return { ...obj, stroke: this.mainTrackColor };
        }
        return obj;
      });
    } else {
      typeOptions = typeOptions.map(obj => {
        return { ...obj, id: this.id };
      });
    }

    // fabric 1.5 path and path from string behave differently
    const pathStr = path ? path.map(segment => segment.join(" ")).join(" ") : this.buildTrackPathString(angle, origin);

    for (var i = 0; i < typeOptions.length; i++) {
      Track.disableDefaults(typeOptions[i], true);
      paths.push(new fabric.Path(pathStr, typeOptions[i]));
    }
    return paths;
  }

  /*
    Creates an SVG Cubic Bezier Curve string from a passed in origin (generally [90,90]) and vectoring out from there at a given angle
    The angle is provided from the mapping module. We create the curve in a straight line, but UI interaction will move the control points
    and produce a smooth Cubic Bezier
  */
  buildTrackPathString(angle, origin) {
    var segmentLen = this.canvas_center[1] / 10;
    var segment1 = [segmentLen, segmentLen * 2, segmentLen * 3];
    var segment2 = [segmentLen * 4, segmentLen * 5, segmentLen * 6];
    var segment3 = [segmentLen * 7, segmentLen * 8, segmentLen * 9];

    var set1 = this.buildTrackPathsSet(segment1, angle, origin)
    var set2 = this.buildTrackPathsSet(segment2, angle, origin)
    var set3 = this.buildTrackPathsSet(segment3, angle, origin)
    return 'M ' + origin[0] + ' ' + origin[1] + ' C ' + set1[0][0] + ', ' + set1[0][1] + ', ' + set1[1][0] + ', ' + set1[1][1] + ', ' + set1[2][0] + ', ' + set1[2][1]
      + ' C ' + set2[0][0] + ', ' + set2[0][1] + ', ' + set2[1][0] + ', ' + set2[1][1] + ', ' + set2[2][0] + ', ' + set2[2][1]
      + ' C ' + set3[0][0] + ', ' + set3[0][1] + ', ' + set3[1][0] + ', ' + set3[1][1] + ', ' + set3[2][0] + ', ' + set3[2][1];
  }

  /*
    creates a 2D array of point pairs which describe where a set of points in the track path string should be
    given an angle and a set of 3 maginitudes describing the desired location of key points in the path
  */
  buildTrackPathsSet(magnitudes, angle, origin) {
    var set = [];
    for (var i = 0; i < magnitudes.length; i++) {
      var xy = this.rotatePoint(magnitudes[i], angle, origin);
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
  rotatePoint(magnitude, angle, origin) {

    //convert to radians
    angle = angle * (Math.PI / 180);

    var x = Math.round(magnitude * (Math.sin(angle)));
    var y = -Math.round(magnitude * (Math.cos(angle)));

    return [x + origin[0], y + origin[1]]
  }

  static disableDefaults(object, secondaryTrack = false) {
    object.selectable = secondaryTrack;
  }

  initTypes() {
    const small = 4;
    const track = 6;
    const tarmac = 8;

    this.types.lowVisTrack = [{
      fill: '',
      stroke: this.trackColor,
      strokeWidth: small,
      strokeDashArray: [small * 1.469, small * 1.063, small * 3.2405, small * 1.063],
    }];
    this.types.offPiste = [{
      fill: '',
      stroke: this.trackColor,
      strokeWidth: small,
      strokeDashArray: [small * 1.3, small * 1.3],
    }];
    this.types.smallTrack = [{
      fill: '',
      stroke: this.trackColor,
      strokeWidth: small,
      strokeDashArray: [],
    }];
    this.types.track = [{
      fill: '',
      stroke: this.trackColor,
      strokeWidth: track,
      strokeDashArray: [],
    }];

    this.types.tarmacRoad = [{
      fill: '',
      stroke: this.trackColor,
      strokeWidth: tarmac,
      strokeDashArray: [],
    },
    {
      fill: '',
      stroke: '#fff',
      strokeWidth: tarmac / 2,
      strokeDashArray: [],
    }];
    this.types.dcw = [{
      fill: '',
      stroke: this.trackColor,
      strokeWidth: 10,
      strokeDashArray: [],
    },
    {
      fill: '',
      stroke: '#fff',
      strokeWidth: 6,
      strokeDashArray: [],
    },
    {
      fill: '',
      stroke: this.trackColor,
      strokeWidth: 2,
      strokeDashArray: [],
    }];
  }

  getTypeOptions(type) {
    const typeOptions = this.types[type].map(obj => {
      obj.perPixelTargetFind = true;
      obj.hasControls = false;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.hasBorders = false;
      obj.selectable = false;
      return obj;
    });
    return typeOptions;
  }

  changeType(type, canvas, mainTrack = true) {
    var pathSVG = $(this.paths[0].toSVG()).attr('d')
    this.clearPathsFromCanvas(canvas);
    var typeOptions = this.getTypeOptions(type);
    if (mainTrack) {
      typeOptions = typeOptions.map(obj => {
        if (obj.stroke === this.trackColor) {
          return { ...obj, stroke: this.mainTrackColor };
        }
        return obj;
      });
    }
    this.setPaths(pathSVG, typeOptions, canvas);
  }

  setPaths(svg, typeOptions, canvas) {
    for (var i = 0; i < typeOptions.length; i++) {
      var path = new fabric.Path(svg, typeOptions[i])
      path.type = 'path';  // For some reason this is not set by fabric.Path in this context
      path.id = this.id;
      canvas.add(path);
      this.paths.push(path);
    }
  }

  clearPathsFromCanvas(canvas) {
    for (var i = 0; i < this.paths.length; i++) {
      canvas.remove(this.paths[i]);
    }
    // clear out old values
    this.paths.length = 0;
  }

  getEndAngle(path) {
    const p1 = { x: path[3][5], y: path[3][6] };
    const p2 = { x: path[3][1], y: path[3][2] };

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Returns degrees for Fabric.js
    return Math.atan2(dy, dx) * (180 / Math.PI) - 90;
  }
}

class EntryTrack extends Track {
  constructor(type, canvas, path, showOrigin = true) {
    super();
    if (path) {
      // Generate track
      this.paths = super.buildTrackPaths(null, this.canvas_center, type, true, path)

      this.origin = this.buildEntryPoint(path[0][1], path[0][2]);
      this.addObjectsToCanvas(showOrigin ? this.paths.concat(this.origin) : this.paths, canvas);
    } else {
      this.buildTrackObjects(type, canvas);
    }

  }

  buildTrackObjects(type, canvas) {
    type = (type !== undefined ? type : 'track');
    var paths = super.buildTrackPaths(0, this.entry_track_origin, type, true)
    var point = this.buildEntryPoint(paths[0].path[0][1], paths[0].path[0][2]);
    this.origin = point;
    this.paths = paths;
    var objects = paths.concat(point);
    this.addObjectsToCanvas(objects, canvas);
  }

  buildEntryPoint(left, top) {
    return new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 1,
      radius: 7,
      fill: this.mainTrackColor,
      stroke: this.mainTrackColor,
      selectable: false
    });
  }

  changeType(type, canvas) {
    super.changeType(type, canvas);
    this.origin.bringToFront();
  }
}

class ExitTrack extends Track {
  constructor(angle, type, canvas, path) {
    super();
    if (path) {
      // Generate track
      this.paths = super.buildTrackPaths(null, this.canvas_center, type, true, path)

      this.end = this.buildExitPoint(path[3][5], path[3][6], this.getEndAngle(path));
      this.addObjectsToCanvas(this.paths.concat(this.end), canvas);

    } else {
      this.buildTrackObjects(angle, type, canvas);
    }
  }

  buildTrackObjects(angle, type, canvas) {
    var paths = super.buildTrackPaths(angle, this.canvas_center, type, true)
    var point = this.buildExitPoint(paths[0].path[3][5], paths[0].path[3][6], angle);
    this.end = point;
    this.paths = paths
    var objects = paths.concat(point);
    this.addObjectsToCanvas(objects, canvas);
  }

  buildExitPoint(left, top, angle) {
    return new fabric.Triangle({
      left: left,
      top: top,
      strokeWidth: 1,
      height: 18,
      width: 18,
      fill: this.mainTrackColor,
      stroke: this.mainTrackColor,
      angle: angle,
    });
  }

  changeAngle(angle, type, canvas) {
    canvas.remove(this.end);
    for (var i = 0; i < this.paths.length; i++) {
      canvas.remove(this.paths[i]);
    }

    this.buildTrackObjects(angle, type, canvas);
  }

  changeType(type, canvas) {
    super.changeType(type, canvas);
    this.end.bringToFront();
  }
}

class AddedTrack extends Track {
  constructor(angle, type, canvas, path, id = null) {
    super(id);
    if (path) {
      // Generate track
      this.paths = super.buildTrackPaths(null, this.canvas_center, type, false, path);
      this.addObjectsToCanvas(this.paths, canvas);
    } else {
      this.paths = this.buildTrackPaths(angle, this.canvas_center, type)
      for (var i = 0; i < this.paths.length; i++) {
        canvas.add(this.paths[i]);
      }
    }
  }

}

/*
  Node exports for test suite
*/
if (typeof window == 'undefined') {
  module.exports.track = Track;
  module.exports.disableDefaults = Track.disableDefaults;
}
