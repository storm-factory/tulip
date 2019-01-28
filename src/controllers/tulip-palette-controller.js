/*
  A module for providing the application with the means to control the map via the UI
*/
class TulipPaletteController extends BasePaletteController{
  constructor(roadbook,glyphManager){
    super();
    this.initListeners(roadbook,glyphManager);
    // this.bindToGlyphModalImages(roadbook);
  }

  //TODO put in shared module
  handleGlyphSelectUI(e){
    e.preventDefault();
    if(!e.shiftKey){
      $('#glyphs').foundation('reveal', 'close');
    }
    $('#glyph-search').focus();
  }
  //move to base class
  populateResults(results){
    var _this = this;
    $.each(results, function(i,result){
      var img = $('<img>').addClass('glyph').attr('src', result.path)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img);
      var showResult = $('<li>').append(link);
      // seems redundant
      // $(img).click(function(e){
      //   _this.handleGlyphSelectUI(e);
      //   _this.addGlyphToTulip(roadbook,this);
      // })
      $('#glyph-search-results').append(showResult);
    });
  }

  //This proxy keeps the class inheretence scoping less confusing
  bindToGlyphModalImages(roadbook){
    super.bindToGlyphModalImages(roadbook,this.addGlyphToTulip);
  }
  //controller function
  initListeners(roadbook,glyphManager){
    var _this = this;
    //move this to base class and have showGlyphModal override?
    $('#glyph-search').keyup(function(){
      $('#glyph-search-results').html('');
      if($(this).val() != ''){
        var results = glyphManager.findGlyphsByName($(this).val());
        _this.populateResults(results);
        $('.glyph').off('click')
        _this.bindToGlyphModalImages(roadbook);
      }
    });

    $('#glyph-search-clear').click(function(){
      $('#glyph-search').val('');
      $('#glyph-search-results').html('');
      $('#glyph-search').focus();
    })

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
      return false
    });
  }
  //have this in base class and override here?
  showGlyphModal(top,left,roadbook){
    app.glyphPlacementPosition = {top: top, left: left};
    $('#glyphs').foundation('reveal', 'open');
    setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    this.bindToGlyphModalImages(roadbook);
    return false
  }
  //controller function
  addGlyphToTulip(roadbook,element){
    var src = $(element).attr('src');
    roadbook.currentlyEditingInstruction.tulip.addGlyph(app.glyphPlacementPosition,src);
  }

}
