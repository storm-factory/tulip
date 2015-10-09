/*

  Phase1
  DONE: change quadradic curve to bezier curve
  DONE: Re add listeners
  DONE: interpolate curves on path
  TODO: simplify interpolation

  Phase2
  DONE: make the start point optional
  TODO: reintegrate parameterized size
  TODO: add arrow on end
  TODO show or hide points if this segment is clicked on
  TODO extend segment for off-piste, track, road, dual-carrage-way part types. Change number of parts and link points to move parts in parallel.

*/

var Segment = Class({

  create: function(originX, originY, endX, endY, editOrigin) {
    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
    this.line = new fabric.Path('M 150 290 C 150, 285, 150, 265, 150, 250 C 150, 235, 150, 215, 150, 200 C 150, 185, 150, 165, 150, 150', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: true, selectable: false });
    canvas.add(this.line);

    this.origin = this.makeOrigin(editOrigin);

    this.joinOne = this.makeMidPoint(this.line.path[1][5], this.line.path[1][6]);
    this.joinOne.name = "joinOne";
    canvas.add(this.joinOne);

    this.joinTwo = this.makeMidPoint(this.line.path[2][5], this.line.path[2][6]);
    this.joinTwo.name = "joinTwo";
    canvas.add(this.joinTwo);
    //
    this.end = this.makeEnd(this.line.path[3][5], this.line.path[3][6]);
    this.end.name = "end";
    canvas.add(this.end);

    canvas.on({
        'object:moving': this.pointMoving,
    });
    console.log(this.line);
  },

  makeOrigin: function(editOrigin){
    if (editOrigin) {
      var origin = new fabric.Circle({
        left: this.line.path[0][1],
        top: this.line.path[0][2],
        strokeWidth: 1,
        radius: 5,
        fill: 'yellow',
        stroke: '#666'
      });

      origin.name = "origin";
      origin.hasBorders = origin.hasControls = false;
      origin.line = this.line
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
    r.line = this.line;
    return r;
  },

  makeEnd: function(left, top){
    var r = new fabric.Triangle({
      left: left,
      top: top,
      strokeWidth: 1,
      height: 12,
      width: 12,
      fill: 'yellow',
      stroke: '#666'
    });

    r.hasBorders = r.hasControls = false;
    r.line = this.line;
    return r;
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

      /*
        ### Origin Point ###
        the origin point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
      */
      var controlPoints = getControlPoints(p.line.path[0][1],p.line.path[0][2],p.line.path[0][1],p.line.path[0][2],p.line.path[1][3],p.line.path[1][4],tension);

      p.line.path[1][1] = controlPoints[0];
      p.line.path[1][2] = controlPoints[1];

      p.line.path[1][3] = controlPoints[2];
      p.line.path[1][4] = controlPoints[3];

      /*
        ### End Point ###
        the end point is relatively easy in that it is only a knot for one control point, it is just an asymetrical relationship
      */
      controlPoints = getControlPoints(p.line.path[1][5],p.line.path[1][6],p.line.path[3][5],p.line.path[3][6],p.line.path[3][5],p.line.path[3][6],tension);

      p.line.path[3][1] = controlPoints[0];
      p.line.path[3][2] = controlPoints[1];

      p.line.path[3][3] = controlPoints[2];
      p.line.path[3][4] = controlPoints[3];

      /*
        ### Join 1 ###
        each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
      */
      controlPoints = getControlPoints(p.line.path[0][1],p.line.path[0][2],p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],tension);

      p.line.path[1][1] = controlPoints[0];
      p.line.path[1][2] = controlPoints[1];

      p.line.path[1][3] = controlPoints[2];
      p.line.path[1][4] = controlPoints[3];

      /*
        ### Join 1 and Join 2 ###
        the joins form their own knot in the middle of the path so we need to interpolate this to be able to flatten the path when we transform which plane it is on
      */

      controlPoints = getControlPoints(p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],p.line.path[3][5],p.line.path[3][6],tension);

      p.line.path[2][3] = controlPoints[0];
      p.line.path[2][4] = controlPoints[1];

      p.line.path[3][1] = controlPoints[2];
      p.line.path[3][2] = controlPoints[3];

      /*
        ### Join 2 ###
        each join basically is a knot for two sets of control points so we need to interpolate both those sets of points to keep the path smooth
      */
      controlPoints = getControlPoints(p.line.path[0][1],p.line.path[0][2],p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],tension);

      p.line.path[1][3] = controlPoints[0];
      p.line.path[1][4] = controlPoints[1];

      p.line.path[2][1] = controlPoints[2];
      p.line.path[2][2] = controlPoints[3];
    }

    if (p.name == "origin") {
      //Move this point on the path
      p.line.path[0][1] = p.left;
      p.line.path[0][2] = p.top;
      interpolatePath();

    }else if(p.name == "end"){
      //Move this point on the path
      p.line.path[3][5] = p.left;
      p.line.path[3][6] = p.top;
      interpolatePath();

    } else if(p.name == "joinOne") {
      //Move this point on the path
      p.line.path[1][5] = p.left;
      p.line.path[1][6] = p.top;
      interpolatePath();

    } else if(p.name == "joinTwo") {
      //Move this point on the path
      p.line.path[2][5] = p.left;
      p.line.path[2][6] = p.top;
      interpolatePath();

    }
  },
});
