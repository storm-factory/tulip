var canvas = document.getElementById('main');
      var context = canvas.getContext('2d');

      var originX = 250;
      var originY = 500;
      var originDot;

      function draw(){
        context.strokeStyle = 'black';
        context.stroke();
      }

      function dot(centerX, centerY) {
        context.moveTo(centerX, centerY);
        context.arc(centerX , centerY, 5, 0, 2 * Math.PI, false);
        context.fillStyle = '#d2d2d2';
        context.fill();
        draw();
        context.fillStyle = 'none';
      }

      function segment(originX, originY, endX, endY) {
        var midpointX = (originX - (originX - endX)/2);
        var midpointY = (originY - (originY - endY)/2);

        var originDot = new dot(originX, originY);
        var midDot    = new dot(midpointX, midpointY);
        var endDot    = new dot(endX, endY);

        context.moveTo(originX, originY);
        context.quadraticCurveTo(midpointX, midpointY, endX, endY);
        context.stroke();
        draw();
      }


      var s1 = new segment(originX, originY, originX, originY - 83.3);
      var s2 = new segment(originX, originY - 83.3, 200, 400);

      //draw();

      // function render() {
      //   context.beginPath();
      //
      //   originDot = context.arc(originX, originY, 5, 0, 2 * Math.PI, false);
      //   context.fillStyle = '#d2d2d2';
      //   context.fill();
      //   context.lineWidth = 1;
      //   context.strokeStyle = '#003300';
      //   context.stroke();
      //   context.moveTo(originX, originY);
      //
      //   //curve1
      //   context.quadraticCurveTo(250, 250, 200, 300);
      //
      //   //curve2
      //   context.quadraticCurveTo(200, 200, 400, 200);
      //
      //   //curve3
      //   context.quadraticCurveTo(200, 200, 400, 200);
      //
      //   // line color
      //   context.strokeStyle = 'black';
      //   context.stroke();
      // }

      // function updateOrigin(x,y) {
      //   originX = x;
      //   originY = y;
      //   context.clearRect(0, 0, canvas.width, canvas.height);
      //   render();
      // }
      //
      // function getMousePos(canvas, evt) {
      //   var rect = canvas.getBoundingClientRect();
      //   return {
      //     x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
      //     y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
      //   };
      // }
      //
      // canvas.addEventListener('mousemove', function(evt) {
      //   var mousePos = getMousePos(canvas, evt);
      //   updateOrigin(mousePos.x, mousePos.y);
      // }, false);
      //
      // render();

