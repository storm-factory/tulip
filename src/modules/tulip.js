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
    console.log(angle);
    this.initTracks(angle);
    this.initListeners();
  },

  initTracks: function(angle){
    this.entryTrackPath = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: false});
    this.entryTrackOrigin = new fabric.Circle({
      left: this.entryTrackPath.path[0][1],
      top: this.entryTrackPath.path[0][2],
      strokeWidth: 1,
      radius: 5,
      fill: 'black',
      stroke: '#666'
    });

    this.entryTrack = new fabric.Group([ this.entryTrackPath, this.entryTrackOrigin ], {
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });
    this.entryTrack.type = 'track';
    this.canvas.add(this.entryTrack);

    this.exitTrackpath = new fabric.Path('M 90 90 C 90, 81, 90, 72, 90, 63 C 90, 54, 90, 45, 90, 36 C 90, 27, 90, 99, 90, 9', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: false});
    this.exitTrackEnd = new fabric.Triangle({
      left: this.exitTrackpath.path[3][5],
      top: this.exitTrackpath.path[3][6],
      strokeWidth: 1,
      height: 12,
      width: 12,
      fill: '#000',
      stroke: '#666'
    });

    this.exitTrack = new fabric.Group([ this.exitTrackpath, this.exitTrackEnd ], {
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });
    this.exitTrack.type = 'track';
    this.canvas.add(this.exitTrack);

    this.objects;
  },

  initListeners: function(){
    var _this = this;
    this.canvas.on('object:selected', function(e){
      //if the object is a track let it be edited

      if(e.target == _this.entryTrack && !(e.target == _this.currentSelectedObject)) {
        _this.currentSelectedObject = new TrackEditor(_this.canvas, e.target._objects[0],true, false);
      }
      if (e.target == _this.exitTrack && !(e.target == _this.currentSelectedObject)) {
        _this.currentSelectedObject = new TrackEditor(_this.canvas, e.target._objects[0], false, true);
      }
    });

    this.canvas.on('selection:cleared', function(e){
      _this.currentSelectedObject.destroy();
    });
  },

});
