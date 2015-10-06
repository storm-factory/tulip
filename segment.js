/*
  DONE: make the start point optional
  TODO extend segment for off-piste, track, road, dual-carrage-way part types. Change number of parts and link points to move parts in parallel.
  TODO figure out rotational geometry
  DONE: decide if an how to link midpoints to work opposite of each other
  TODO show or hide points if this segment is clicked on
  TODO edit length
*/

var Segment = Class({

  create: function(originX, originY, endX, endY, editOrigin) {
    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
    this.line = new fabric.Path('M 150 300 Q 150, 252.5, 150, 225 M 150 225 Q 150, 197.5, 150, 150', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: true, selectable: false });

    canvas.add(this.line);

    this.origin = this.makeOrigin(editOrigin);

    this.midpointOne = this.makeCurveMidPoint(this.line.path[1][1], this.line.path[1][2]);
    this.midpointOne.name = "midpointOne";
    canvas.add(this.midpointOne);

    this.midpointTwo = this.makeCurveMidPoint(this.line.path[3][1], this.line.path[3][2])
    this.midpointTwo.name = "midpointTwo";
    canvas.add(this.midpointTwo);

    this.join = this.makeCurveEndPoint(this.line.path[1][3], this.line.path[1][4]);
    this.join.name = "join";
    canvas.add(this.join);

    this.end = this.makeCurveEndPoint(this.line.path[3][3], this.line.path[3][4]);
    this.end.name = "end";
    canvas.add(this.end);

    this.midpointOne.opposite = this.midpointTwo;
    this.midpointTwo.opposite = this.midpointOne;
    this.end.midpointOne = this.midpointOne;
    this.end.midpointTwo = this.midpointTwo;
    this.origin.midpointOne = this.midpointOne;
    this.origin.midpointTwo = this.midpointTwo;

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

  makeCurveMidPoint: function(left, top, line1, line2, line3){
    var c = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 1,
      radius: 4,
      fill: 'yellow',
      stroke: '#666',
      bound_to: line1
    });

    c.hasBorders = c.hasControls = false;
    c.line = this.line;
    return c;
  },

  pointMoving: function(e){
    var p = e.target;

    if (e.target.name == "origin") {
      var deltaX = p.line.path[0][1] - p.left;
      var deltaY = p.line.path[0][2] - p.top;
      p.line.path[0][1] = p.left;
      p.line.path[0][2] = p.top;
      //move opposite part midpoint
      p.line.path[1][1] = p.line.path[1][1] + deltaX;
      p.line.path[1][2] = p.line.path[1][2] + deltaY;
      p.midpointOne.setLeft(p.midpointOne.left + deltaX).setCoords();
      p.midpointOne.setTop(p.midpointOne.top + deltaY).setCoords();
      //move this part mid point
      p.line.path[3][1] = p.line.path[3][1] + deltaX;
      p.line.path[3][2] = p.line.path[3][2] + deltaY;
      p.midpointTwo.setLeft(p.midpointTwo.left + deltaX).setCoords();
      p.midpointTwo.setTop(p.midpointTwo.top + deltaY).setCoords();
      //move segment midpoint
      p.line.path[1][3] = p.line.path[1][3] + deltaX;
      p.line.path[1][4] = p.line.path[1][4] + deltaY;
      p.line.path[2][1] = p.line.path[2][1] + deltaX;
      p.line.path[2][2] = p.line.path[2][2] + deltaY;
    }else if(e.target.name == "end"){
      var deltaX = p.line.path[3][3] - p.left;
      var deltaY = p.line.path[3][4] - p.top;

      p.line.path[3][3] = p.left;
      p.line.path[3][4] = p.top;

      //move opposite part midpoint
      p.line.path[1][1] = p.line.path[1][1] + deltaX;
      p.line.path[1][2] = p.line.path[1][2] + deltaY;
      p.midpointOne.setLeft(p.midpointOne.left + deltaX).setCoords();
      p.midpointOne.setTop(p.midpointOne.top + deltaY).setCoords();
      //move this part mid point
      p.line.path[3][1] = p.line.path[3][1] + deltaX;
      p.line.path[3][2] = p.line.path[3][2] + deltaY;
      p.midpointTwo.setLeft(p.midpointTwo.left + deltaX).setCoords();
      p.midpointTwo.setTop(p.midpointTwo.top + deltaY).setCoords();
      //move segment midpoint
      p.line.path[1][3] = p.line.path[1][3] + deltaX;
      p.line.path[1][4] = p.line.path[1][4] + deltaY;
      p.line.path[2][1] = p.line.path[2][1] + deltaX;
      p.line.path[2][2] = p.line.path[2][2] + deltaY;

      deltaX = 0;
      deltaY = 0;
    }else if (e.target.name == "midpointTwo") {
        var deltaX = p.line.path[3][1] - p.left;
        var deltaY = p.line.path[3][2] - p.top;
        p.line.path[3][1] = p.left;
        p.line.path[3][2] = p.top;
        //Move complimentary midpoint by same X amount in opposite direction
        p.line.path[1][1] = p.line.path[1][1] + deltaX;
        p.opposite.setLeft(p.opposite.left + deltaX).setCoords();
        deltaX = 0;
        //Move complimentary midpoint by same Y amount in opposite direction
        p.line.path[1][2] = p.line.path[1][2] + deltaY;
        p.opposite.setTop(p.opposite.top + deltaY).setCoords();
        deltaY = 0;
    } else if(e.target.name == "midpointOne") {
        var deltaX = p.line.path[1][1] - p.left;
        var deltaY = p.line.path[1][2] - p.top;
        p.line.path[1][1] = p.left;
        p.line.path[1][2] = p.top;
        //Move complimentary midpoint by same X amount in opposite direction
        p.line.path[3][1] = p.line.path[3][1] + deltaX;
        p.opposite.setLeft(p.opposite.left + deltaX).setCoords();
        deltaX = 0;
        //Move complimentary midpoint by same Y amount in opposite direction
        p.line.path[3][2] = p.line.path[3][2] + deltaY;
        p.opposite.setTop(p.opposite.top + deltaY).setCoords();
        deltaY = 0;
    } else if(e.target.name == "join") {
      var deltaX = p.line.path[1][3] - p.left;
      var deltaY = p.line.path[1][4] - p.top;
      console.log("X: " + deltaX + " Y: "+deltaY)
      p.line.path[1][3] = p.left;
      p.line.path[1][4] = p.top;
      p.line.path[2][1] = p.left;
      p.line.path[2][2] = p.top;
      //move opposite part midpoint
      p.line.path[1][1] = p.line.path[1][1] - deltaX;
      p.line.path[1][2] = p.line.path[1][2] - deltaY;
      // p.midpointOne.setLeft(p.midpointOne.left + deltaX).setCoords();
      // p.midpointOne.setTop(p.midpointOne.top + deltaY).setCoords();
      //move this part mid point
      p.line.path[3][1] = p.line.path[3][1] - deltaX;
      p.line.path[3][2] = p.line.path[3][2] - deltaY;
      // p.midpointTwo.setLeft(p.midpointTwo.left + deltaX).setCoords();
      // p.midpointTwo.setTop(p.midpointTwo.top + deltaY).setCoords();
    }
  },
});
