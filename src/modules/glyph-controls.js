// TODO refactor this to use MVC pattern and act as a controller for the currentlyEditingWaypoint for the roadbook
class GlyphControls{

  constructor(resourcesPath){
    this.fs = require('fs');
    this.files = [];
    this.getGylphNames(resourcesPath);
    this.initListeners();
    this.bindToGlyphImages();
    this.addToNote = false;
  }

  getGylphNames(resourcesPath){
    try {
      this.files = this.fs.readdirSync(resourcesPath + '/app/assets/svg/glyphs/').filter(function(val){ return val.endsWith('.svg')});
    } catch (e) {
      console.log("using unpackaged filesys");
      this.files = this.fs.readdirSync('assets/svg/glyphs').filter(function(val){ return val.endsWith('.svg')});
    }
  }

  handleGlyphSelectUI(e){
    e.preventDefault();
    if(!e.shiftKey){
      $('#glyphs').foundation('reveal', 'close');
    }
    $('#glyph-search').focus();
  }

  populateResults(results){
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
  }

  searchGlyphNames(query){
    var results=[];
    $.each(this.files, function(i,file){
      if(file.indexOf(query) != -1){
        results.push({name: file.replace('.svg', ''), path: 'assets/svg/glyphs/'+file})
      }
    });
    return results;
  }

  bindToGlyphImages(){
    var _this = this;
    $('.glyph').click(function(e){
      _this.handleGlyphSelectUI(e);
      _this.addGlyphToInstruction(this);
      app.noteControls.checkForNotification();
    });
  }

  initListeners(){
    var _this = this;
    $('#glyph-search').keyup(function(){
      $('#glyph-search-results').html('');
      if($(this).val() != ''){
        var results = _this.searchGlyphNames($(this).val());
        _this.populateResults(results);
        $('.glyph').off('click')
        _this.bindToGlyphImages();
      }
    });

    $('#glyph-search-clear').click(function(){
      $('#glyph-search').val('');
      $('#glyph-search-results').html('');
      $('#glyph-search').focus();
    })

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
          // NOTE this module should only know about the roadbook
          app.roadbook.currentlyEditingWaypoint.tulip.beginRemoveGlyph();
        }else{
          // NOTE this module should only know about the roadbook
          app.roadbook.currentlyEditingWaypoint.tulip.removeLastGlyph();
        }
        return false
      }
      _this.showGlyphModal($(this).data('top'),$(this).data('left'));
      return false
    });
  }

  showGlyphModal(top,left){
    app.glyphPlacementPosition = {top: top, left: left};
    this.addToNote = false;
    $('#glyphs').foundation('reveal', 'open');
    setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    return false
  }

  addGlyphToInstruction(element){
    var src = $(element).attr('src');
    if(this.addToNote){
      // NOTE this module should only know about the roadbook
      app.roadbook.appendGlyphToNoteTextEditor($('<img>').attr('src', src).addClass('normal'));
    } else {
      // NOTE this module should only know about the roadbook
      app.roadbook.currentlyEditingWaypoint.tulip.addGlyph(app.glyphPlacementPosition,src);
    }
  }

};
