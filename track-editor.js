/*

  Phase1
  DONE: change quadradic curve to bezier curve
  DONE: Re add listeners
  DONE: interpolate curves on path
  DONE: simplify interpolation

  Phase2
  DONE: make the start point optional
  TODO: reintegrate parameterized size
  DONE: add arrow on end
  TODO show or hide points if this segment is clicked on
  TODO extend segment for off-piste, track, road, dual-carrage-way part types. Change number of parts and link points to move parts in parallel.

*/

var TrackEditor = Class({

  create: function(track, entryTrack, editOrigin) {
    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
    this.track = track

    this.origin = this.makeOrigin(entryTrack, editOrigin);

    this.joinOne = this.makeMidPoint(this.track.path[1][5], this.track.path[1][6]);
    this.joinOne.name = "joinOne";
    canvas.add(this.joinOne);

    this.joinTwo = this.makeMidPoint(this.track.path[2][5], this.track.path[2][6]);
    this.joinTwo.name = "joinTwo";
    canvas.add(this.joinTwo);
    //
    this.end = this.makeEnd(entryTrack);


    canvas.on({
        'object:moving': this.pointMoving,
    });

    this.track.end = this.end
    this.track.origin = this.origin
  },

  destroy: function(){
    canvas.remove(this.origin);
    canvas.remove(this.joinOne);
    canvas.remove(this.joinTwo);
    canvas.remove(this.end);
    delete this;
  },

  makeOrigin: function(entryTrack,editOrigin){
    if (!entryTrack && editOrigin) {
      var origin = new fabric.Circle({
        left: this.track.path[0][1],
        top: this.track.path[0][2],
        strokeWidth: 1,
        radius: 5,
        fill: 'yellow',
        stroke: '#666'
      });

      origin.name = "origin";
      origin.hasBorders = origin.hasControls = false;
      origin.track = this.track
      canvas.add(origin);
      return origin
    }
  },

  makeMidPoint: function(left, top){
    var r = new fabric.Rect({
      left: left,
      top: top,
      strokeWidth: 1,
      height: 8,
      width: 8,
      fill: 'yellow',
      stroke: '#666'
    });

    r.hasBorders = r.hasControls = false;
    r.track = this.track;
    return r;
  },

  makeEnd: function(left, top){

    if(!entryTrack){
      var end = new fabric.Triangle({
        left: this.track.path[3][5],
        top: this.track.path[3][6],
        strokeWidth: 1,
        height: 12,
        width: 12,
        fill: 'yellow',
        stroke: '#666'
      });

      end.hasBorders = r.hasControls = false;
      end.track = this.track;
      end.name = "end";
      // this.end.centeredRotation = true;
      canvas.add(end);
      return end;
    }

  },


  pointMoving: function(e){
    var p = e.target;

    function getControlPoints(x0,y0,x1,y1,x2,y2,t){
        //needs attribution and deplagariztion
        var d01=Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
        var d12=Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
        var fa=(t)*d01/(d01+d12);   // scaling factor for triangle Ta
        var fb=(t)*d12/(d01+d12);   // ditto for Tb, simplifies to fb=t-fa
        var p1x=x1-fa*(x2-x0);    // x2-x0 is the width of triangle T
        var p1y=y1-fa*(y2-y0);    // y2-y0 is the height of T
        var p2x=x1+fb*(x2-x0);
        var p2y=y1+fb*(y2-y0);

        return [p1x,p1y,p2x,p2y];
    }

    function interpolatePath(){

      var tension = .3;
      var controlPoints;
      /*
        ### Origin Point ###
        the origin point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
      */
      controlPoints = getControlPoints(p.track.path[0][1],p.track.path[0][2],p.track.path[0][1],p.track.path[0][2],p.track.path[1][5],p.track.path[1][6],tension);

      p.track.path[1][1] = controlPoints[0];
      p.track.path[1][2] = controlPoints[1];

      p.track.path[1][3] = controlPoints[2];
      p.track.path[1][4] = controlPoints[3];

      /*
        ### End Point ###
        the end point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
      */
      controlPoints = getControlPoints(p.track.path[2][5],p.track.path[2][6],p.track.path[3][5],p.track.path[3][6],p.track.path[3][5],p.track.path[3][6],tension);

      p.track.path[3][1] = controlPoints[0];
      p.track.path[3][2] = controlPoints[1];

      p.track.path[3][3] = controlPoints[2];
      p.track.path[3][4] = controlPoints[3];

      /*
        ### Join 1 ###
        each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
      */
      controlPoints = getControlPoints(p.track.path[0][1],p.track.path[0][2],p.track.path[1][5],p.track.path[1][6],p.track.path[2][5],p.track.path[2][6],tension);

      p.track.path[1][1] = controlPoints[0];
      p.track.path[1][2] = controlPoints[1];

      p.track.path[1][3] = controlPoints[2];
      p.track.path[1][4] = controlPoints[3];

      /*
        ### Join 1 and Join 2 ###
        the joins form their own knot in the middle of the path so we need to interpolate this to be able to flatten the path when we transform which plane it is on
      */

      controlPoints = getControlPoints(p.track.path[1][5],p.track.path[1][6],p.track.path[2][5],p.track.path[2][6],p.track.path[3][5],p.track.path[3][6],tension);

      p.track.path[2][3] = controlPoints[0];
      p.track.path[2][4] = controlPoints[1];

      p.track.path[3][1] = controlPoints[2];
      p.track.path[3][2] = controlPoints[3];

      /*
        ### Join 2 ###
        each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
      */
      controlPoints = getControlPoints(p.track.path[0][1],p.track.path[0][2],p.track.path[1][5],p.track.path[1][6],p.track.path[2][5],p.track.path[2][6],tension);

      p.track.path[1][3] = controlPoints[0];
      p.track.path[1][4] = controlPoints[1];

      p.track.path[2][1] = controlPoints[2];
      p.track.path[2][2] = controlPoints[3];


      /*
        figure out the angle of the end cap USING VECTORS AND TRIG!
      */
      if(p.track.end){
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
      }
    }

    if (p.name == "origin") {
      //Move this point on the path
      p.track.path[0][1] = p.left;
      p.track.path[0][2] = p.top;
      interpolatePath();

    }else if(p.name == "end"){
      //Move this point on the path
      p.track.path[3][5] = p.left;
      p.track.path[3][6] = p.top;
      interpolatePath();

    } else if(p.name == "joinOne") {
      //Move this point on the path
      p.track.path[1][5] = p.left;
      p.track.path[1][6] = p.top;
      interpolatePath();

    } else if(p.name == "joinTwo") {
      //Move this point on the path
      p.track.path[2][5] = p.left;
      p.track.path[2][6] = p.top;
      interpolatePath();

    }
  },
});
