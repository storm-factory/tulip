/*
  A module for providing the application with the means to control the map via the UI
*/
class TulipPaletteController{
  constructor(roadbook,glyphController){
    this.glyphController = glyphController;
    this.initListeners(roadbook);
  }

  addGlyphToTulip(roadbook,element){
    var src = $(element).attr('src');
    roadbook.currentlyEditingInstruction.tulip.addGlyph(app.glyphPlacementPosition,src);
  }

  initListeners(roadbook){
    var _this = this;

    //TODO this needs some coupling rework.
    $('.glyph-grid').click(function(e){
      e.preventDefault();
      if($(this).hasClass('undo')){
        if(e.shiftKey){
          // NOTE this module should only know about the roadbook
          roadbook.currentlyEditingInstruction.tulip.beginRemoveGlyph();
        }else{
          // NOTE this module should only know about the roadbook
          roadbook.currentlyEditingInstruction.tulip.removeLastGlyph();
        }
        return false
      }
      app.glyphPlacementPosition = {top: $(this).data('top'), left: $(this).data('left')};
      _this.glyphController.showGlyphModal(roadbook,_this.addGlyphToTulip);
    });
  }
}
