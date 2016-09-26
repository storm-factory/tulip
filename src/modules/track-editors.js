class TrackEditor {
  // change params to entryTrack and exitTrack: entry track can't move end point, exit track can't move origin.
  // all other bets are off.
  constructor(canvas, track, handleColor='#296EFF') {
    // fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

    this.track = track
    this.track.editor = this;
    // path = TODO get paths from track object
    this.paths = track.objectsOnCanvas.getObjects('path');
    this.handleColor = handleColor
    this.canvas = canvas
    // TODO somehow set handle color via child class
    this.joinOneHandle = this.makeMidPoint(this.paths[0].path[1][5], this.paths[0].path[1][6]);
    this.joinOneHandle.name = "joinOneHandle";
    this.canvas.add(this.joinOneHandle);

    this.joinTwoHandle = this.makeMidPoint(this.paths[0].path[2][5], this.paths[0].path[2][6]);
    this.joinTwoHandle.name = "joinTwoHandle";
    this.canvas.add(this.joinTwoHandle);
  }

  destroy(){
    this.canvas.remove(this.originHandle);
    this.canvas.remove(this.joinOneHandle);
    this.canvas.remove(this.joinTwoHandle);
    this.canvas.remove(this.endHandle);
    delete this;
  }

  makeMidPoint(left, top){
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

  getControlPoints(x1,y1,x2,y2,x3,y3,t){
      //Thanks Rob
      var delta1=Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
      var delta2=Math.sqrt(Math.pow(x3-x2,2)+Math.pow(y3-y2,2));
      var scale1=(t)*delta1/(delta1+delta2);
      var scale2=(t)*delta2/(delta1+delta2);
      var controlPoint1x=x2-scale1*(x3-x1);
      var controlPoint1y=y2-scale1*(y3-y1);
      var controlPoint2x=x2+scale2*(x3-x1);
      var controlPoint2y=y2+scale2*(y3-y1);

      return [controlPoint1x,controlPoint1y,controlPoint2x,controlPoint2y];
  }

  interpolatePath(path){
    var tension = .3;
    var controlPoints;
    /*
      ### Origin Point ###
      the origin point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
    */
    controlPoints = this.getControlPoints(path[0][1],path[0][2],path[0][1],path[0][2],path[1][5],path[1][6],tension);

    path[1][1] = controlPoints[0];
    path[1][2] = controlPoints[1];

    path[1][3] = controlPoints[2];
    path[1][4] = controlPoints[3];

    /*
      ### End Point ###
      the end point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
    */
    controlPoints = this.getControlPoints(path[2][5],path[2][6],path[3][5],path[3][6],path[3][5],path[3][6],tension);

    path[3][1] = controlPoints[0];
    path[3][2] = controlPoints[1];

    path[3][3] = controlPoints[2];
    path[3][4] = controlPoints[3];

    /*
      ### Join 1 ###
      each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
    */
    controlPoints = this.getControlPoints(path[0][1],path[0][2],path[1][5],path[1][6],path[2][5],path[2][6],tension);

    path[1][1] = controlPoints[0];
    path[1][2] = controlPoints[1];

    path[1][3] = controlPoints[2];
    path[1][4] = controlPoints[3];

    /*
      ### Join 1 and Join 2 ###
      the joins form their own knot in the middle of the path so we need to interpolate this to be able to flatten the path when we transform between vertical and horizontal planes
    */

    controlPoints = this.getControlPoints(path[1][5],path[1][6],path[2][5],path[2][6],path[3][5],path[3][6],tension);

    path[2][3] = controlPoints[0];
    path[2][4] = controlPoints[1];

    path[3][1] = controlPoints[2];
    path[3][2] = controlPoints[3];

    /*
      ### Join 2 ###
      each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
    */
    controlPoints = this.getControlPoints(path[0][1],path[0][2],path[1][5],path[1][6],path[2][5],path[2][6],tension);

    path[1][3] = controlPoints[0];
    path[1][4] = controlPoints[1];

    path[2][1] = controlPoints[2];
    path[2][2] = controlPoints[3];
  }

  // TODO this could be an object literal
  pointMoving(point){
    for(i=0;i<this.paths.length;i++){
      if (point.name == "originHandle") {
        //Move this point on the path

        this.paths[i].path[0][1] = point.left;
        this.paths[i].path[0][2] = point.top;
        // NOTE could overload
        if(this.track.origin){
          // for some reason the objects left and top are relative to the group not the canvas so we have to correct that
          this.track.origin.left = point.left - this.track.objectsOnCanvas.left;
          this.track.origin.top = point.top - this.track.objectsOnCanvas.top;
        }
      }else if(point.name == "endHandle"){
        //Move this point on the path
        this.paths[i].path[3][5] = point.left;
        this.paths[i].path[3][6] = point.top;
        // NOTE could overload
        if(this.track.end){
          // for some reason the objects left and top are relative to the group not the canvas so we have to correct that
          this.track.end.left = point.left - this.track.objectsOnCanvas.left;
          this.track.end.top = point.top - this.track.objectsOnCanvas.top;
        }
      } else if(point.name == "joinOneHandle") {
        //Move this point on the path
        this.paths[i].path[1][5] = point.left;
        this.paths[i].path[1][6] = point.top;
      } else if(point.name == "joinTwoHandle") {
        //Move this point on the path
        this.paths[i].path[2][5] = point.left;
        this.paths[i].path[2][6] = point.top;

      }
      this.interpolatePath(this.paths[i].path);
    }
  }
};

class EntryTrackEditor extends TrackEditor {
  constructor(canvas, track) {
    super(canvas, track,'#ffBA29');
    this.originHandle = this.makeEntryOrigin(this.paths[0].path[0][1],this.paths[0].path[0][2]);
  }

  makeEntryOrigin(left, top){
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
  constructor(canvas, track){
    super(canvas, track,'#ffBA29');
    this.endHandle = this.makeExitEnd(this.paths[0].path[3][5],this.paths[0].path[3][6]);
  }

  makeExitEnd(left, top){
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

  interpolatePath(path){
    super.interpolatePath(path);
    /*
      figure out the angle of the end cap USING VECTORS AND TRIG!
    */
    var x1 = path[3][5];
    var y1 = path[3][6];
    var x2 = path[3][1];
    var y2 = path[3][2];

    var opp = x1 - x2;
    var adj = y1 - y2;
    var hyp = Math.sqrt(Math.pow(opp,2)+Math.pow(adj,2));
    var theta = Math.asin(opp/hyp) * (180/3.14);
    if(adj > 0) {
      theta = 180 - theta
    }
    this.track.end.angle = theta;
    this.endHandle.angle = theta;
  }
}

class AddedTrackEditor extends TrackEditor {
  constructor(canvas, track){
    super(canvas, track);
    this.originHandle = this.makeMidPoint(this.paths[0].path[0][1],this.paths[0].path[0][2]);
    this.endHandle = this.makeMidPoint(this.paths[0].path[3][5],this.paths[0].path[3][6]);
    this.originHandle.name = "originHandle";
    this.endHandle.name = "endHandle";
    this.canvas.add(this.originHandle);
    this.canvas.add(this.endHandle);
  }
}
