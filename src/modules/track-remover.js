// TODO refactor this to use MVC pattern and act as a controller for the tulip of the currentlyEditingWaypoint for the roadbook
class TrackRemover {
  constructor(tulip,track,index){
      fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
      this.tulip = tulip;
      this.track = track;
      this.trackIndex = index;

      this.makeRemoveHandle();
      var _this = this;
      this.tulip.canvas.on('mouse:down',function(e){
        if(e.target == _this.removeHandle){
          _this.removeFromTulip(_this.tulip.canvas, _this.track);
          _this.removeFromTrackArray(_this.tulip.tracks, _this.trackIndex);
          if(e.e.shiftKey && _this.tulip.tracks.length > 0){
            // we have to finish, then rebegin because the tulip.tracks indicies change when we remove this.track
            _this.tulip.finishRemove();
            _this.tulip.beginRemoveTrack();
          } else {
            _this.tulip.finishRemove();
            _this.tulip.beginEdit();
          }
        }
      });
  }

  makeRemoveHandle(){
    this.removeHandle = new fabric.Text('\u00D7', {
      fontSize: 30,
      left: this.track.paths[0].path[3][5],
      top: this.track.paths[0].path[3][6],
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      fill: '#ff4200',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false,
    });

    this.tulip.canvas.add(this.removeHandle);
  }

  removeFromTulip(canvas, track){
    for(var i=0;i<track.paths.length;i++){
      // this.tulip.canvas.remove(this.track.paths[i]);
      canvas.remove(track.paths[i]);
    }
  }

  removeFromTrackArray(array, index){
    // this.tulip.tracks.splice(this.trackIndex,1);
    array.splice(index,1);
  }

  destroy(){
    this.tulip.canvas.remove(this.removeHandle);
    delete this;
  }
};
