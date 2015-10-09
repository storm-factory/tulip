/*

  Phase1
  DONE: change quadradic curve to bezier curve
  DONE: Re add listeners
  TODO: interpolate curves on path

  Phase2
  DONE: make the start point optional
  TODO show or hide points if this segment is clicked on
  TODO extend segment for off-piste, track, road, dual-carrage-way part types. Change number of parts and link points to move parts in parallel.

*/

var Segment = Class({

  create: function(originX, originY, endX, endY, editOrigin) {
    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
    // this.line = new fabric.Path('M 150 300 C 150, 275, 150, 250 M 150 250 C 150, 225, 150, 200 M 150 200 C 150, 175, 150, 150', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: true, selectable: false });
    this.line = new fabric.Path('M 150 300 C 150, 285, 150, 265, 150, 250 C 150, 235, 150, 215, 150, 200 C 150, 185, 150, 165, 150, 150', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: true, selectable: false });
    canvas.add(this.line);

    this.origin = this.makeOrigin(editOrigin);

    this.joinOne = this.makeCurveEndPoint(this.line.path[1][5], this.line.path[1][6]);
    this.joinOne.name = "joinOne";
    canvas.add(this.joinOne);

    this.joinTwo = this.makeCurveEndPoint(this.line.path[2][5], this.line.path[2][6]);
    this.joinTwo.name = "joinTwo";
    canvas.add(this.joinTwo);
    //
    this.end = this.makeCurveEndPoint(this.line.path[3][5], this.line.path[3][6]);
    this.end.name = "end";
    canvas.add(this.end);

    canvas.on({
        'object:moving': this.pointMoving,
    });
    console.log(this.line);
  },

  makeOrigin: function(editOrigin){
    if (editOrigin) {
      var origin = this.makeCurveEndPoint(this.line.path[0][1], this.line.path[0][2], this.line, null, null);
      origin.name = "origin";
      canvas.add(origin);
      return origin
    }
  },

  makeCurveEndPoint: function(left, top){
    var c = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 1,
      radius: 4,
      fill: 'yellow',
      stroke: '#666'
    });

    c.hasBorders = c.hasControls = false;
    c.line = this.line;
    return c;
  },

  pointMoving: function(e){
    var p = e.target;

    function getControlPoints(x0,y0,x1,y1,x2,y2,t){
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
      var controlPoints = getControlPoints(p.line.path[0][1],p.line.path[0][2],p.line.path[0][1],p.line.path[0][2],p.line.path[1][3],p.line.path[1][4],.4);
      //
      p.line.path[1][1] = controlPoints[0];
      p.line.path[1][2] = controlPoints[1];

      controlPoints = getControlPoints(p.line.path[1][5],p.line.path[1][6],p.line.path[3][5],p.line.path[3][6],p.line.path[3][5],p.line.path[3][6],.4);

      p.line.path[3][1] = controlPoints[0];
      p.line.path[3][2] = controlPoints[1];

      p.line.path[3][3] = controlPoints[2];
      p.line.path[3][4] = controlPoints[3];

      controlPoints = getControlPoints(p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],p.line.path[3][5],p.line.path[3][6],.4);

      p.line.path[2][3] = controlPoints[0];
      p.line.path[2][4] = controlPoints[1];

      p.line.path[3][1] = controlPoints[2];
      p.line.path[3][2] = controlPoints[3];

      controlPoints = getControlPoints(p.line.path[0][1],p.line.path[0][2],p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],.4);

      p.line.path[1][1] = controlPoints[0];
      p.line.path[1][2] = controlPoints[1];

      p.line.path[1][3] = controlPoints[0];
      p.line.path[1][4] = controlPoints[1];

      p.line.path[2][1] = controlPoints[2];
      p.line.path[2][2] = controlPoints[3];

      controlPoints = getControlPoints(p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],p.line.path[3][5],p.line.path[3][6],.4);

      p.line.path[2][3] = controlPoints[0];
      p.line.path[2][4] = controlPoints[1];

      p.line.path[3][1] = controlPoints[2];
      p.line.path[3][2] = controlPoints[3];

      controlPoints = getControlPoints(p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],p.line.path[3][5],p.line.path[3][6],.4);
      // console.log(controlPoints);
      p.line.path[2][3] = controlPoints[0];
      p.line.path[2][4] = controlPoints[1];

      p.line.path[3][1] = controlPoints[2];
      p.line.path[3][2] = controlPoints[3];

      p.line.path[3][3] = controlPoints[2];
      p.line.path[3][4] = controlPoints[3];


      controlPoints = getControlPoints(p.line.path[0][1],p.line.path[0][2],p.line.path[1][5],p.line.path[1][6],p.line.path[2][5],p.line.path[2][6],.4);
      // console.log(controlPoints);
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
