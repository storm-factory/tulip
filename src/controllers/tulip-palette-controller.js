/*
  A module for providing the application with the means to control the map via the UI
*/
class TulipPaletteController extends BasePaletteController{
  constructor(roadbook,glyphManager){
    super(glyphManager);
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
      _this.showGlyphModal($(this).data('top'),$(this).data('left'),roadbook);
    });
  }

  showGlyphModal(top,left,roadbook){
    $('.glyph').off('click')
    app.glyphPlacementPosition = {top: top, left: left};
    $('#glyphs').foundation('reveal', 'open');
    setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    super.bindToGlyphModalImages(roadbook,this.addGlyphToTulip);
    super.bindToGlyphModalSearch(roadbook,this.addGlyphToTulip);
  }

}
