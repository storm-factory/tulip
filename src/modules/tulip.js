/*
  This sumbitch should be able to load from a canvas when that particular canvas enters edit mode.
  It should load shit from svg files in the assests directory and allow them to be placed on and edited in the canvas.
*/

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function(el){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.currentSelectedObject;

    this.initTracks();
    this.initListeners();
  },

  initTracks: function(){
    //this.entryTrackPath = new fabric.Path('M 150 290 C 150, 285, 150, 265, 150, 250 C 150, 235, 150, 215, 150, 200 C 150, 185, 150, 165, 150, 150', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: false});
    this.entryTrackPath = new fabric.Path('M 90 174 C 90, 171, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: false});
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

      lockMovementY: true,
      hasBorders: false
    });
    this.entryTrack.type = 'track';
    this.canvas.add(this.entryTrack);

    this.exitTrackpath;
    this.exitTrackEnd;
    this.exitTrack;

    this.objects;
  },

  initListeners: function(){
    var _this = this;
    this.canvas.on('object:selected', function(e){
      //if the object is a track let it be edited
      if (e.target.type == 'track' && !(e.target == _this.currentSelectedObject)) {
        //also need to redraw edit points if track is moved
        _this.currentSelectedObject = new TrackEditor(_this.canvas, e.target._objects[0],false)
      }
    });

    this.canvas.on('selection:cleared', function(e){
      _this.currentSelectedObject.destroy();
    });
  },

});
