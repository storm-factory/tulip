class BasePaletteController{

  constructor(){

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
}
