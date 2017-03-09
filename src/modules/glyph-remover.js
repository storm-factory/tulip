// TODO refactor this to use MVC pattern and act as a controller for the tulip of the currentlyEditingWaypoint for the roadbook
var GlyphRemover = Class({

  create: function(tulip,glyph,index){
      fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
      this.tulip = tulip;
      this.glyph = glyph;
      this.glyphIndex = index;

      this.makeRemoveHandle();
      var _this = this;
      this.tulip.canvas.on('mouse:down',function(e){
        if(e.target == _this.removeHandle){
          _this.removeFromTulip();
          if(e.e.shiftKey && _this.tulip.glyphs.length > 0){
            // we have to finish, then rebegin because the tulip.glyphs indicies change when we remove this.glyph
            _this.tulip.finishRemove();
            _this.tulip.beginRemoveGlyph();
          } else {
            _this.tulip.finishRemove();
            _this.tulip.beginEdit();
          }
        }
      });
  },

  makeRemoveHandle: function(){
    this.removeHandle = new fabric.Text('\u00D7', {
      fontSize: 30,
      left: this.glyph.getLeft(),
      top: this.glyph.getTop(),
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
    this.tulip.canvas.remove(this.glyph);
    this.tulip.glyphs.splice(this.glyphIndex,1);
  },

  destroy: function(){
    this.tulip.canvas.remove(this.removeHandle);
    delete this;
  }
});
