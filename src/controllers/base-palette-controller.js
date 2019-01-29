class BasePaletteController{

  constructor(glyphManager){
    this.glyphManager = glyphManager;
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
        var results = _this.glyphManager.findGlyphsByName($(this).val());
        _this.populateResults(results);
        _this.bindToGlyphModalImages(roadbook,callback);
      }
    });
  }

  bindToGlyphModalSearchClear(){
    $('#glyph-search-clear').off('click');
    $('#glyph-search-clear').click(function(){
      $('#glyph-search').val('');
      $('#glyph-search-results').html('');
      $('#glyph-search').focus();
    })
  }

  //move to base class
  populateResults(results){
    var _this = this;
    $.each(results, function(i,result){
      var img = $('<img>').addClass('glyph').attr('src', result.path)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img);
      var showResult = $('<li>').append(link);
      $('#glyph-search-results').append(showResult);
    });
  }


}
