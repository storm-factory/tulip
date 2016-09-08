/*
  This object handles all the drag and drop editing of tracks whose visual representation is a single path on the this.canvas
  I've attempted to make it as simple as possible using what I could learn about bezier curve interpolation
  and also some basic linear algebra I picked up along the way.

  Much thanks to Rob Spencer and his post about spline interpolation, it was the perfect amount of detail meets simplicity:
  http://scaledinnovation.com/analytics/splines/aboutSplines.html

*/

var TrackEditor = Class({
  // change params to entryTrack and exitTrack: entry track can't move end point, exit track can't move origin.
  // all other bets are off.
  create: function(canvas, track, editOrigin, editEnd, defaultTrack) {
    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
    this.track = track
    this.canvas = canvas
    this.editOrigin = editOrigin;
    this.editEnd = editEnd;

    // We want to treat the entry and exit tracks differently than everything else
    if(defaultTrack){
      this.handleColor = '#ffBA29';
      this.origin = this.makeEntryOrigin(this.track.path[0][1],this.track.path[0][2]);
      this.end = this.makeExitEnd(this.track.path[3][5],this.track.path[3][6]);
    } else {
      this.handleColor = '#296EFF';
      this.origin = this.makeMidPoint(this.track.path[0][1],this.track.path[0][2]);
      this.end = this.makeMidPoint(this.track.path[3][5],this.track.path[3][6]);
      this.origin.name = "origin";
      this.end.name = "end";
      this.canvas.add(this.origin);
      this.canvas.add(this.end);
    }


    this.joinOne = this.makeMidPoint(this.track.path[1][5], this.track.path[1][6]);
    this.joinOne.name = "joinOne";
    this.canvas.add(this.joinOne);

    this.joinTwo = this.makeMidPoint(this.track.path[2][5], this.track.path[2][6]);
    this.joinTwo.name = "joinTwo";
    this.canvas.add(this.joinTwo);

    //TODO move to listeners function
    // NOTE could overload (have to)
    var _this = this;
    this.canvas.on('object:moving',function(e){
        if(e.target.track.paths == undefined){
          _this.pointMoving(e.target, _this);
        }
    });
  },
  // NOTE could overload
  destroy: function(){
    this.canvas.remove(this.origin);
    this.canvas.remove(this.joinOne);
    this.canvas.remove(this.joinTwo);
    this.canvas.remove(this.end);
    delete this;
  },
  // NOTE could overload
  makeEntryOrigin: function(left, top){
    if (this.editOrigin) {
      var origin = new fabric.Circle({
        left: left,
        top: top,
        strokeWidth: 1,
        radius: 7,
        fill: this.handleColor,
        stroke: '#787878'
      });

      origin.name = "origin";
      origin.hasBorders = origin.hasControls = false;
      origin.track = this.track
      this.canvas.add(origin);
      return origin
    }
  },
  // NOTE could overload
  makeMidPoint: function(left, top){
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
    r.track = this.track;
    return r;
  },
  // NOTE could overload
  makeExitEnd: function(left, top){
    if(this.editEnd){
      var end = new fabric.Triangle({
        left: left,
        top: top,
        strokeWidth: 1,
        height: 15,
        width: 15,
        fill: this.handleColor,
        stroke: '#787878'
      });

      end.hasBorders = end.hasControls = false;
      end.hasBorders = false;
      end.track = this.track;
      end.name = "end";
      end.angle = this.track.end.angle;
      this.canvas.add(end);
      return end;
    }

  },
  // NOTE could overload
  getControlPoints: function(x1,y1,x2,y2,x3,y3,t){
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
  },

  interpolatePath: function(point){

    var tension = .3;
    var controlPoints;
    var p = point;
    /*
      ### Origin Point ###
      the origin point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
    */
    controlPoints = this.getControlPoints(p.track.path[0][1],p.track.path[0][2],p.track.path[0][1],p.track.path[0][2],p.track.path[1][5],p.track.path[1][6],tension);

    p.track.path[1][1] = controlPoints[0];
    p.track.path[1][2] = controlPoints[1];

    p.track.path[1][3] = controlPoints[2];
    p.track.path[1][4] = controlPoints[3];

    /*
      ### End Point ###
      the end point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
    */
    controlPoints = this.getControlPoints(p.track.path[2][5],p.track.path[2][6],p.track.path[3][5],p.track.path[3][6],p.track.path[3][5],p.track.path[3][6],tension);

    p.track.path[3][1] = controlPoints[0];
    p.track.path[3][2] = controlPoints[1];

    p.track.path[3][3] = controlPoints[2];
    p.track.path[3][4] = controlPoints[3];

    /*
      ### Join 1 ###
      each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
    */
    controlPoints = this.getControlPoints(p.track.path[0][1],p.track.path[0][2],p.track.path[1][5],p.track.path[1][6],p.track.path[2][5],p.track.path[2][6],tension);

    p.track.path[1][1] = controlPoints[0];
    p.track.path[1][2] = controlPoints[1];

    p.track.path[1][3] = controlPoints[2];
    p.track.path[1][4] = controlPoints[3];

    /*
      ### Join 1 and Join 2 ###
      the joins form their own knot in the middle of the path so we need to interpolate this to be able to flatten the path when we transform between vertical and horizontal planes
    */

    controlPoints = this.getControlPoints(p.track.path[1][5],p.track.path[1][6],p.track.path[2][5],p.track.path[2][6],p.track.path[3][5],p.track.path[3][6],tension);

    p.track.path[2][3] = controlPoints[0];
    p.track.path[2][4] = controlPoints[1];

    p.track.path[3][1] = controlPoints[2];
    p.track.path[3][2] = controlPoints[3];

    /*
      ### Join 2 ###
      each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
    */
    controlPoints = this.getControlPoints(p.track.path[0][1],p.track.path[0][2],p.track.path[1][5],p.track.path[1][6],p.track.path[2][5],p.track.path[2][6],tension);

    p.track.path[1][3] = controlPoints[0];
    p.track.path[1][4] = controlPoints[1];

    p.track.path[2][1] = controlPoints[2];
    p.track.path[2][2] = controlPoints[3];


    /*
      figure out the angle of the end cap USING VECTORS AND TRIG!
    */
    if(p.track.end && this.end){
      var x1 = p.track.path[3][5];
      var y1 = p.track.path[3][6];
      var x2 = p.track.path[3][1];
      var y2 = p.track.path[3][2];

      var opp = x1 - x2;
      var adj = y1 - y2;
      var hyp = Math.sqrt(Math.pow(opp,2)+Math.pow(adj,2));
      theta = Math.asin(opp/hyp) * (180/3.14);
      if(adj > 0) {
        theta = 180 - theta
      }
      p.track.end.angle = theta;
      this.end.angle = theta;
    }
  },
  // TODO this could be an object literal
  pointMoving: function(point, _this){
    if (point.name == "origin") {
      //Move this point on the path
      point.track.path[0][1] = point.left;
      point.track.path[0][2] = point.top;
      // NOTE could overload
      if(point.track.origin){
        point.track.origin.left = point.left;
        point.track.origin.top = point.top;
      }
    }else if(point.name == "end"){
      //Move this point on the path
      point.track.path[3][5] = point.left;
      point.track.path[3][6] = point.top;
      // NOTE could overload
      if(point.track.end){
        point.track.end.left = point.left;
        point.track.end.top = point.top;
      }
    } else if(point.name == "joinOne") {
      //Move this point on the path
      point.track.path[1][5] = point.left;
      point.track.path[1][6] = point.top;
    } else if(point.name == "joinTwo") {
      //Move this point on the path
      point.track.path[2][5] = point.left;
      point.track.path[2][6] = point.top;

    }
    _this.interpolatePath(point);
  },
});
