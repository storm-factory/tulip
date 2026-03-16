// TODO in some senses this is a pure utility module, but is also a bit of a model. see if that can be seperated at all
class TrackEditor {
  constructor(canvas, track, handleColor = '#296EFF') {

    this.track = track
    this.track.editor = this;
    this.paths = track.paths;
    this.handleColor = handleColor
    this.canvas = canvas
    this.renderJoinHandles();
  }

  destroy() {
    this.canvas.remove(this.originHandle);
    this.canvas.remove(this.joinOneHandle);
    this.canvas.remove(this.joinTwoHandle);
    this.canvas.remove(this.endHandle);
    delete this;
  }

  makeMidPoint(left, top) {
    var r = new fabric.Rect({
      left: left,
      top: top,
      strokeWidth: 1,
      height: 8,
      width: 8,
      fill: this.handleColor,
      stroke: '#787878'
    });

    r.hasBorders = r.hasControls = false;
    r.editor = this;
    return r;
  }

  getControlPoints(x1, y1, x2, y2, x3, y3, t) {
    //Thanks Rob
    var delta1 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    var delta2 = Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2));
    var scale1 = (t) * delta1 / (delta1 + delta2);
    var scale2 = (t) * delta2 / (delta1 + delta2);
    var controlPoint1x = x2 - scale1 * (x3 - x1);
    var controlPoint1y = y2 - scale1 * (y3 - y1);
    var controlPoint2x = x2 + scale2 * (x3 - x1);
    var controlPoint2y = y2 + scale2 * (y3 - y1);

    return [controlPoint1x, controlPoint1y, controlPoint2x, controlPoint2y];
  }

  interpolatePath(path) {
    var tension = .3;
    var controlPoints;
    /*
      ### Origin Point ###
      the origin point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
    */
    controlPoints = this.getControlPoints(path[0][1], path[0][2], path[0][1], path[0][2], path[1][5], path[1][6], tension);

    path[1][1] = controlPoints[0];
    path[1][2] = controlPoints[1];

    path[1][3] = controlPoints[2];
    path[1][4] = controlPoints[3];

    /*
      ### End Point ###
      the end point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
    */
    controlPoints = this.getControlPoints(path[2][5], path[2][6], path[3][5], path[3][6], path[3][5], path[3][6], tension);

    path[3][1] = controlPoints[0];
    path[3][2] = controlPoints[1];

    path[3][3] = controlPoints[2];
    path[3][4] = controlPoints[3];

    /*
      ### Join 1 ###
      each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
    */
    controlPoints = this.getControlPoints(path[0][1], path[0][2], path[1][5], path[1][6], path[2][5], path[2][6], tension);

    path[1][1] = controlPoints[0];
    path[1][2] = controlPoints[1];

    path[1][3] = controlPoints[2];
    path[1][4] = controlPoints[3];

    /*
      ### Join 1 and Join 2 ###
      the joins form their own knot in the middle of the path so we need to interpolate this to be able to flatten the path when we transform between vertical and horizontal planes
    */

    controlPoints = this.getControlPoints(path[1][5], path[1][6], path[2][5], path[2][6], path[3][5], path[3][6], tension);

    path[2][3] = controlPoints[0];
    path[2][4] = controlPoints[1];

    path[3][1] = controlPoints[2];
    path[3][2] = controlPoints[3];

    /*
      ### Join 2 ###
      each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
    */
    controlPoints = this.getControlPoints(path[0][1], path[0][2], path[1][5], path[1][6], path[2][5], path[2][6], tension);

    path[1][3] = controlPoints[0];
    path[1][4] = controlPoints[1];

    path[2][1] = controlPoints[2];
    path[2][2] = controlPoints[3];
  }

  // TODO explain the significance of the 2D and 3D arrays and how they are derived from the fabric.js path object
  pointMoving(point) {
    if (point.name == "originHandle") {
      this.transformPath([[[0, 1], [0, 2]], [[3, 5], [3, 6]]], point.left, point.top)
      this.setTrackCapPosition("origin", point.left, point.top);
    } else if (point.name == "endHandle") {
      this.transformPath([[[3, 5], [3, 6]], [[0, 1], [0, 2]]], point.left, point.top)
      this.setTrackCapPosition("end", point.left, point.top);
    } else if (point.name == "joinOneHandle") {
      this.setTrackCurve([[1, 5], [1, 6]], point.left, point.top);
    } else if (point.name == "joinTwoHandle") {
      this.setTrackCurve([[2, 5], [2, 6]], point.left, point.top);
    }
  }

  /*
    TODO explain this mess
  */
  setTrackCurve(controlPoints, left, top) {
    for (var i = 0; i < this.paths.length; i++) {
      this.paths[i].path[controlPoints[0][0]][controlPoints[0][1]] = left;
      this.paths[i].path[controlPoints[1][0]][controlPoints[1][1]] = top;
      this.interpolatePath(this.paths[i].path);
    }
  }
  // TODO try to explain all the BS we go through to overcome to translate left top to cartesian coordinates
  transformPath(controlPoints, left, top) {
    // get the vectors from the screen coordinate systems and make them nice to deal with
    var screenTailX = this.paths[0].path[controlPoints[1][0][0]][controlPoints[1][0][1]];
    var screenTailY = this.paths[0].path[controlPoints[1][1][0]][controlPoints[1][1][1]];

    var screenStartHeadPosX = this.paths[0].path[controlPoints[0][0][0]][controlPoints[0][0][1]];
    var screenStartHeadPosY = this.paths[0].path[controlPoints[0][1][0]][controlPoints[0][1][1]];

    var screenEndHeadPosX = left;
    var screenEndHeadPosY = top;


    // translate them to cartesian
    var startCoords = this.translateScreenToCartesian(screenStartHeadPosX, screenStartHeadPosY, screenTailX, screenTailY)
    var endCoords = this.translateScreenToCartesian(screenEndHeadPosX, screenEndHeadPosY, screenTailX, screenTailY)
    // find scaling factor
    var m1 = Math.sqrt(Math.pow(startCoords.x, 2) + Math.pow(startCoords.y, 2));
    var m2 = Math.sqrt(Math.pow(endCoords.x, 2) + Math.pow(endCoords.y, 2));
    var deltaM = m2 / m1;
    //find theta
    var theta = Math.atan2(startCoords.x * endCoords.y - startCoords.y * endCoords.x, startCoords.x * endCoords.x + startCoords.y * endCoords.y);

    // translate all intermediary points to cartesian, rotate them (and eventually scale)
    // then translate back to screen coordinates
    for (var i = 0; i < this.paths.length; i++) {
      // TODO these loops could be their own method
      for (var j = 1; j < this.paths[i].path.length; j++) {
        for (var k = 1; k < this.paths[i].path[j].length; k++) {
          if (k % 2 == 1) {
            // translate to cartesian
            var coords = this.translateScreenToCartesian(this.paths[i].path[j][k], this.paths[i].path[j][k + 1], screenTailX, screenTailY)
            //scale
            coords.x = coords.x * deltaM;
            coords.y = coords.y * deltaM;
            // rotate
            var xp = coords.x * Math.cos(theta) - coords.y * Math.sin(theta);
            var yp = coords.x * Math.sin(theta) + coords.y * Math.cos(theta);
            // translate back and assign
            coords = this.translateCartesianToScreen(xp, yp, screenTailX, screenTailY);
            this.paths[i].path[j][k] = coords.x;
            this.paths[i].path[j][k + 1] = coords.y;
            if (j == 1 && k == 5) {
              this.joinOneHandle.setLeft(coords.x);
              this.joinOneHandle.setTop(coords.y);
            }
            if (j == 2 && k == 5) {
              this.joinTwoHandle.setLeft(coords.x);
              this.joinTwoHandle.setTop(coords.y);
            }
          }
        }
      }
      // set these after otherwise some of the math gets messed up
      this.paths[i].path[controlPoints[0][0][0]][controlPoints[0][0][1]] = left;
      this.paths[i].path[controlPoints[0][1][0]][controlPoints[0][1][1]] = top;
    }
    // TODO figure out how to update the listener position, this is kinda hacky
    this.canvas.remove(this.joinOneHandle);
    this.canvas.remove(this.joinTwoHandle);
    this.renderJoinHandles();
  }

  /*
    adjusts the position of the track cap which is either an origin or and end.
  */
  setTrackCapPosition(capType, left, top) {
    if (this.track[capType]) {
      this.track[capType].left = left;
      this.track[capType].top = top;
    }
  }

  translateScreenToCartesian(headX, headY, tailX, tailY) {
    return {
      x: (headX - tailX),
      y: (-headY + tailY)
    };
  }

  translateCartesianToScreen(headX, headY, tailX, tailY) {
    return {
      x: headX + tailX,
      y: tailY - headY
    };
  }

  renderJoinHandles() {
    this.joinOneHandle = this.makeMidPoint(this.paths[0].path[1][5], this.paths[0].path[1][6]);
    this.joinTwoHandle = this.makeMidPoint(this.paths[0].path[2][5], this.paths[0].path[2][6]);
    this.joinOneHandle.name = "joinOneHandle";
    this.joinTwoHandle.name = "joinTwoHandle";
    this.canvas.add(this.joinOneHandle);
    this.canvas.add(this.joinTwoHandle);
  }
  /*
    TODO remove if not needed
  */
  checkTrackLinearity() {
    var x1 = this.paths[0].path[0][1];
    var y1 = this.paths[0].path[0][2];

    var x2 = this.paths[0].path[1][5];
    var y2 = this.paths[0].path[1][6];

    var x3 = this.paths[0].path[2][5];
    var y3 = this.paths[0].path[2][6];

    var x4 = this.paths[0].path[3][5];
    var y4 = this.paths[0].path[3][6];

    return (((y2 - y1) / (x2 - x1) == (y3 - y1) / (x3 - x1)) && ((y2 - y1) / (x2 - x1) == (y4 - y1) / (x4 - x1)));
  }
};

class EntryTrackEditor extends TrackEditor {
  constructor(canvas, track) {
    super(canvas, track, '#ffBA29');
    this.originHandle = this.makeEntryOrigin(this.paths[0].path[0][1], this.paths[0].path[0][2]);
  }

  makeEntryOrigin(left, top) {
    var originHandle = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 1,
      radius: 7,
      fill: this.handleColor,
      stroke: '#787878'
    });

    originHandle.name = "originHandle";
    originHandle.hasBorders = originHandle.hasControls = false;
    originHandle.editor = this;
    this.canvas.add(originHandle);
    return originHandle
  }
}

class ExitTrackEditor extends TrackEditor {
  constructor(canvas, track) {
    super(canvas, track, '#ffBA29');
    this.endHandle = this.makeExitEnd(this.paths[0].path[3][5], this.paths[0].path[3][6]);
  }

  makeExitEnd(left, top) {
    var endHandle = new fabric.Triangle({
      left: left,
      top: top,
      strokeWidth: 1,
      height: 15,
      width: 15,
      fill: this.handleColor,
      stroke: '#787878'
    });

    endHandle.hasBorders = endHandle.hasControls = false;
    endHandle.editor = this;
    endHandle.name = "endHandle";
    endHandle.angle = this.track.end.angle;
    this.canvas.add(endHandle);
    return endHandle;
  }

  interpolatePath(path) {
    super.interpolatePath(path);
    this.adjustEndAngle();
  }

  transformPath(controlPoints, left, top) {
    super.transformPath(controlPoints, left, top);
    this.adjustEndAngle();
  }

  /*
    figure out the angle of the end cap USING VECTORS AND TRIG!
  */
  adjustEndAngle() {
    var x1 = this.paths[0].path[3][5];
    var y1 = this.paths[0].path[3][6];
    var x2 = this.paths[0].path[3][1];
    var y2 = this.paths[0].path[3][2];

    var opp = x1 - x2;
    var adj = y1 - y2;
    var hyp = Math.sqrt(Math.pow(opp, 2) + Math.pow(adj, 2));
    var theta = Math.asin(opp / hyp) * (180 / Math.PI);
    if (adj > 0) {
      theta = 180 - theta
    }
    this.track.end.angle = theta;
    this.endHandle.angle = theta;
  }
}

class AddedTrackEditor extends TrackEditor {
  constructor(canvas, track) {
    super(canvas, track);
    this.originHandle = this.makeMidPoint(this.paths[0].path[0][1], this.paths[0].path[0][2]);
    this.endHandle = this.makeMidPoint(this.paths[0].path[3][5], this.paths[0].path[3][6]);
    this.originHandle.name = "originHandle";
    this.endHandle.name = "endHandle";
    this.canvas.add(this.originHandle);
    this.canvas.add(this.endHandle);
  }
}
