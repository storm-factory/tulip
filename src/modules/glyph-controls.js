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

  handleGlyphSelectUI: function(e){
    e.preventDefault();
    if(!e.shiftKey){
      $('#glyphs').foundation('reveal', 'close');
      $('#glyph-search').val('');
      $('#glyph-search-results').html('');
    }
  },

  populateResults: function(results){
    var _this = this;
    $.each(results, function(i,result){
      var img = $('<img>').addClass('glyph').attr('src', result.path)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img);
      var showResult = $('<li>').append(link);
      $(img).click(function(e){
        _this.handleGlyphSelectUI(e);
        _this.addGlyphToInstruction(this);
      })
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
      _this.handleGlyphSelectUI(e);
      _this.addGlyphToInstruction(this);
    });

    $('.note-grid').click(function(e){
      e.preventDefault();
      _this.addToNote = true;
      $('#glyphs').foundation('reveal', 'open');
      setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    });

    //TODO fill out this todo, you know you wanna.
    $('.glyph-grid').click(function(e){
      e.preventDefault();
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
    });

    $('select.note-glyph-size').change(function(e){
      var size = $("option:selected", this).data('image-size')
      var images = $('#note-editor div.ql-editor img.resizable')
      images.removeClass();
      images.addClass('resizable');
      images.addClass(size);
    });
  },

  addGlyphToInstruction: function(element){
    var src = $(element).attr('src');

    if(this.addToNote){
      app.roadbook.noteTextEditor.insertEmbed(app.roadbook.noteTextEditor.getLength(),'image',src);
      $('#note-editor div.ql-editor img').unbind();
      $('#note-editor div.ql-editor img').click(function(){
        $(this).toggleClass("resizable");
      });
    } else {
      app.roadbook.currentlyEditingWaypoint.tulip.addGlyph(app.glyphPlacementPosition,src);
    }
  }

});
