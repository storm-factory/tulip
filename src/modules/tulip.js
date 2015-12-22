/*
  This sumbitch should be able to load from a canvas when that particular canvas enters edit mode.
  It should load shit from svg files in the assests directory and allow them to be placed on and edited in the canvas.
*/

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function(el, json, angle){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.currentSelectedObject;
    this.initTracks(angle);
    this.initListeners();
  },

  initTracks: function(angle){
    this.entryTrack = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90',
                                              { fill: '',
                                                stroke: '#000',
                                                strokeWidth: 5,
                                                hasControls: false,
                                                lockMovementX: true,
                                                lockMovementY: true,
                                                hasBorders: false
                                              });
    this.entryTrackOrigin = new fabric.Circle({
      left: this.entryTrack.path[0][1],
      top: this.entryTrack.path[0][2],
      strokeWidth: 1,
      radius: 5,
      fill: '#000',
      stroke: '#666',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });
    this.entryTrackOrigin.track = this.entryTrack;
    this.entryTrack.origin = this.entryTrackOrigin;


    this.canvas.add(this.entryTrack);
    this.canvas.add(this.entryTrackOrigin);

    console.log(this.exitTrackPoints(angle));
    var exitTrackPoints = this.exitTrackPoints(angle);
    this.exitTrack = new fabric.Path('M 90 90 C 90, 81, 90, 72, 90, 63 C 90, 54, 90, 45, 90, 36 C 90, 27, 90, 99, 90, 9',
                                              { fill: '',
                                              stroke: '#000',
                                              strokeWidth: 5,
                                              hasControls: false,
                                              lockMovementX: true,
                                              lockMovementY: true,
                                              hasBorders: false
                                            });



    this.exitTrackEnd = new fabric.Triangle({
      left: this.exitTrack.path[3][5],
      top: this.exitTrack.path[3][6],
      strokeWidth: 1,
      height: 12,
      width: 12,
      fill: '#000',
      stroke: '#666',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });
    this.exitTrackEnd.track = this.exitTrack
    this.exitTrack.end = this.exitTrackEnd;

    this.canvas.add(this.exitTrack);
    this.canvas.add(this.exitTrackEnd);

    this.objects;
  },

  initListeners: function(){
    var _this = this;
    this.canvas.on('object:selected', function(e){
      //if the object is a track let it be edited
      if(e.target == _this.entryTrack || e.target == _this.entryTrackOrigin) {
        if(_this.currentSelectedObject && _this.currentSelectedObject != e.target){
          _this.currentSelectedObject.destroy();
        }
        _this.currentSelectedObject = new TrackEditor(_this.canvas, _this.entryTrack,true, false);
      }
      if (e.target == _this.exitTrack || e.target == _this.exitTrackEnd) {
        if(_this.currentSelectedObject && _this.currentSelectedObject != e.target){
          _this.currentSelectedObject.destroy();
        }
        _this.currentSelectedObject = new TrackEditor(_this.canvas, _this.exitTrack, false, true);
      }
    });

    this.canvas.on('selection:cleared', function(e){
      _this.exitTrackEnd.setCoords();
      _this.entryTrackOrigin.setCoords();

      _this.currentSelectedObject.destroy();
    });
  },

  exitTrackPoints: function(angle) {
    var x1 = 27*(Math.sin(angle)); //x(cos(theta)) + y(sin(theta)) where x = 0, y = 27
    var y1 = 27*(Math.cos(angle)); // -x(sin(theta)) + y(cos(theta)) where x = 0, y = 27

    var x2 = 54*(Math.sin(angle)); //x(cos(theta)) + y(sin(theta)) where x = 0, y = 54
    var y2 = 54*(Math.cos(angle)); // -x(sin(theta)) + y(cos(theta)) where x = 0, y = 54

    var x3 = 81*(Math.sin(angle)); //x(cos(theta)) + y(sin(theta)) where x = 0, y = 81
    var y3 = 81*(Math.cos(angle)); // -x(sin(theta)) + y(cos(theta)) where x = 0, y = 81

    return [[90+x1, 90-y1],[90+x2, 90-y2],[90+x3, 90-y3]];
  }

});
