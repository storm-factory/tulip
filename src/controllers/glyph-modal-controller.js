// I dont think this needs to inherit, it can be it's own controller called GlyphModalController or something
class GlyphModalController{

  constructor(model){
    this.model = model;
    this.bindToGlyphModalSearchClear();
  }

  handleGlyphSelectUI(e){
    e.preventDefault();
    if(!e.shiftKey){
      $('#glyphs').foundation('reveal', 'close');
    }
    $('#glyph-search').focus();
  }

  bindToGlyphModalImages(roadbook,callback){
    var _this = this;
    $('.glyph').click(function(e){
      _this.handleGlyphSelectUI(e);
      callback(roadbook,this);
    });
  }

  bindToGlyphModalSearch(roadbook,callback){
    var _this = this;
    $('#glyph-search').keyup(function(){
      $('#glyph-search-results').html('');
      if($(this).val() != ''){
        var results = _this.model.findGlyphsByName($(this).val());
        _this.populateResults(results);
        _this.bindToGlyphModalImages(roadbook,callback);
      }
    });
  }

  bindToGlyphModalSearchClear(){
    var _this = this;
    $('#glyph-search-clear').off('click');
    $('#glyph-search-clear').click(function(){
      _this.clearGlyphSearch();
    })
  }

  clearGlyphSearch(){
    $('#glyph-search').val('');
    $('#glyph-search-results').html('');
    $('#glyph-search').focus();
  }


  populateResults(results){
    var _this = this;
    $.each(results, function(i,result){
      var img = $('<img>').addClass('glyph').attr('src', result.path)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img);
      var showResult = $('<li>').append(link);
      $('#glyph-search-results').append(showResult);
    });
  }

  showGlyphModal(roadbook,callback){
    this.clearGlyphSearch();
    $('.glyph').off('click');
    $('#glyphs').foundation('reveal', 'open');
    setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    this.bindToGlyphModalImages(roadbook,callback);
    this.bindToGlyphModalSearch(roadbook,callback);
  }

}
