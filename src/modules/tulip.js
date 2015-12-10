/*
  This sumbitch should be able to load from a canvas when that particular canvas enters edit mode.
  It should load shit from svg files in the assests directory and allow them to be placed on and edited in the canvas.
*/

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
// var canvas = new fabric.Canvas('main');
// canvas.selection = false;

// var currentSelectedObject;

// var entryTrackPath = new fabric.Path('M 150 290 C 150, 285, 150, 265, 150, 250 C 150, 235, 150, 215, 150, 200 C 150, 185, 150, 165, 150, 150', { fill: '', stroke: 'black', strokeWidth: 3, hasControls: false});
// var entryTrackOrigin = new fabric.Circle({
//   left: entryTrackPath.path[0][1],
//   top: entryTrackPath.path[0][2],
//   strokeWidth: 1,
//   radius: 5,
//   fill: 'black',
//   stroke: '#666'
// });
//
// var entryTrack = new fabric.Group([ entryTrackPath, entryTrackOrigin ], {
//   hasControls: false,
//
//   lockMovementY: true,
//   hasBorders: false
// });
// entryTrack.type = 'track';
// canvas.add(entryTrack);

// var exitTrackpath;
// var exitTrackEnd;
// var exitTrack;
//
// var objects;

var Tulip = Class({
  create: function(el){
    this.canvas = new fabric.Canvas(el, {width:180, height:180});
    this.canvas.selection = false;
    this.currentSelectedObject;

    this.initTracks();
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
    // this.canvas.add(this.entryTrack);
    var circle = new fabric.Circle({
      left: 10,
      top: 10,
      strokeWidth: 1,
      radius: 5,
      fill: 'black',
      stroke: '#666'
    });

    this.canvas.add(circle);

    this.exitTrackpath;
    this.exitTrackEnd;
    this.exitTrack;

    this.objects;
  },

  initListeners: function(){

    this.canvas.on('object:selected', function(e){
      console.log(e.target.type);
      //if the object is a track let it be edited
      if (e.target.type == 'track' && !(e.target == currentSelectedObject)) {
        //also need to redraw edit points if track is moved

        currentSelectedObject = new TrackEditor(e.target._objects[0],false)
      }
    });

    this.canvas.on('selection:cleared', function(e){
      this.currentSelectedObject.destroy();
    });
  },

});
