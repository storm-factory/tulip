var TrackRemover = Class({
  create: function(tulip,track,index){
      fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
      this.tulip = tulip;
      this.track = track;
      this.trackIndex = index;

      this.makeRemoveHandle();
      var _this = this;
      this.tulip.canvas.on('mouse:down',function(e){
        if(e.target == _this.removeHandle){
          _this.removeFromTulip();
          if(e.e.shiftKey){
            // we have to finish, then rebegin because the tulip.tracks indicies change when we remove this.track
            _this.tulip.finishTrackRemove();
            _this.tulip.beginRemoveTrack();
          } else {
            _this.tulip.finishTrackRemove();
            _this.tulip.beginEdit();
          }
        }
      });
  },

  makeRemoveHandle: function(){
    this.removeHandle = new fabric.Text('\u00D7', {
      fontSize: 30,
      left: this.track.path[3][5],
      top: this.track.path[3][6],
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      fill: '#ff4200',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false,
    });

    this.tulip.canvas.add(this.removeHandle);
  },

  removeFromTulip: function(){
    this.tulip.canvas.remove(this.track);
    this.tulip.tracks.splice(this.trackIndex,1);
  },

  destroy: function(){
    this.tulip.canvas.remove(this.removeHandle);
    delete this;
  }
});
