var GlyphControls = Class({
  singleton: true,

  create: function(){
    this.fs = require('fs');
    this.process = require('electron').remote.process;
    this.files = [];
    this.getGylphNames();
    this.initListeners();
    this.addToNote = false;
  },


  getGylphNames(){
    try {
      this.files = this.fs.readdirSync(this.process.resourcesPath + '/app/assets/svg/glyphs');
    } catch (e) {
      console.log("using unpackaged filesys");
      this.files = this.fs.readdirSync('assets/svg/glyphs');
    }
  },

  processFiles: function(){

  },

  populateResults: function(results){
    var _this = this;
    $.each(results, function(i,result){
      var img = $('<img>').addClass('glyph').attr('src', result.path)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img);
      var showResult = $('<li>').append(link);
      $(img).click(function(){_this.addGlyphToInstruction(this);})
      $('#glyph-search-results').append(showResult);
    });
  },

  searchGlyphNames: function(query){
    results=[];
    $.each(this.files, function(i,file){
      if(file.indexOf(query) != -1){
        results.push({name: file.replace('.svg', ''), path: 'assets/svg/glyphs/'+file})
      }
    });
    return results;
  },

  initListeners: function(){
    var _this = this;
    $('#glyph-search').keyup(function(){
      $('#glyph-search-results').html('');
      if($(this).val() != ''){
        var results = _this.searchGlyphNames($(this).val());
        _this.populateResults(results);
      }
    });

    $('.glyph').click(function(e){
      e.preventDefault();
      if(!e.shiftKey){
        $('#glyphs').foundation('reveal', 'close');
        $('#glyph-search').val('');
        $('#glyph-search-results').html('');
      }
      _this.addGlyphToInstruction(this);
    });

    //TODO fill out this todo, you know you wanna.
    $('.glyph-grid').click(function(e){
      e.preventDefault();
      if($(this).hasClass('note-grid')){
        if($(this).hasClass('undo')){
          app.roadbook.currentlyEditingWaypoint.removeLastNoteGlyph(); //TODO make app level function for this
          return
        }
        _this.addToNote = true;
        $('#glyphs').foundation('reveal', 'open');
        setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
        return false
      } else{
        if($(this).hasClass('undo')){
          if(e.shiftKey){
            app.roadbook.currentlyEditingWaypoint.tulip.beginRemoveGlyph();
          }else{
            app.roadbook.currentlyEditingWaypoint.tulip.removeLastGlyph();
          }
          return false
        }
        app.glyphPlacementPosition = {top: $(this).data('top'), left: $(this).data('left')};
        _this.addToNote = false;
        $('#glyphs').foundation('reveal', 'open');
        setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
        return false
      }
    });
  },

  addGlyphToInstruction: function(element){
    var src = $(element).attr('src');

    if(this.addToNote){
      app.roadbook.currentlyEditingWaypoint.addNoteGlyph(src)
    } else {
      app.roadbook.currentlyEditingWaypoint.tulip.addGlyph(app.glyphPlacementPosition,src);
    }
  }

});
