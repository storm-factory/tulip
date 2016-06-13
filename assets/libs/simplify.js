/*
  Copyright (c) 2015, Vladimir Agafonkin
  All rights reserved.

  Redistribution and use in source and binary forms, with or without modification, are
  permitted provided that the following conditions are met:

     1. Redistributions of source code must retain the above copyright notice, this list of
        conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright notice, this list
        of conditions and the following disclaimer in the documentation and/or other materials
        provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
  COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
  HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
  TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/

var Simplify = Class({

// square distance from a point to a segment
getSqSegDist(p, p1, p2) {
    var x = p1.lat,
        y = p1.lng,
        dx = p2.lat - x,
        dy = p2.lng - y;
    if (dx !== 0 || dy !== 0) {

        var t = ((p.lat - x) * dx + (p.lng - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2.lat;
            y = p2.lng;

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.lat - x;
    dy = p.lng - y;

    return dx * dx + dy * dy;
},
// rest of the code doesn't care about point format

simplifyDPStep(points, first, last, sqTolerance, simplified) {
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++) {
        var sqDist = this.getSqSegDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) this.simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) this.simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
},

// simplification using Ramer-Douglas-Peucker algorithm
simplifyDouglasPeucker(points, sqTolerance) {
    var last = points.length - 1;

    var simplified = [points[0]];
    this.simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
},

});
