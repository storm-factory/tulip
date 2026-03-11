// TODO refactor this to use MVC pattern and act as a controller for the currentlyEditingWaypoint for the roadbook
// Phase 6: Converted to vanilla JavaScript
class GlyphControls{

  constructor(){
    this.fs = require('fs');
    this.process = require('@electron/remote').process;
    this.files = [];
    this.getGylphNames();
    this.initListeners();
    this.bindToGlyphImages();
    this.addToNote = false;
  }

  getGylphNames(){
    try {
      this.files = this.fs.readdirSync(this.process.resourcesPath + '/app/assets/svg/glyphs/').filter(function(val){ return val.endsWith('.svg')});
    } catch (e) {
      console.log("using unpackaged filesys");
      this.files = this.fs.readdirSync('assets/svg/glyphs').filter(function(val){ return val.endsWith('.svg')});
    }
  }

  handleGlyphSelectUI(e){
    e.preventDefault();
    if(!e.shiftKey){
      var glyphsModal = document.querySelector('#glyphs');
      if(glyphsModal) $(glyphsModal).foundation('reveal', 'close'); // Phase 7: Foundation modal
    }
    var glyphSearch = document.querySelector('#glyph-search');
    if(glyphSearch) glyphSearch.focus();
  }

  populateResults(results){
    var _this = this;
    results.forEach(function(result){
      var img = document.createElement('img');
      img.classList.add('glyph');
      img.setAttribute('src', result.path);

      var link = document.createElement('a');
      link.classList.add('th');
      link.setAttribute('title', result.name);
      link.appendChild(img);

      var showResult = document.createElement('li');
      showResult.appendChild(link);

      img.addEventListener('click', function(e){
        _this.handleGlyphSelectUI(e);
        _this.addGlyphToInstruction(this);
      });

      var searchResults = document.querySelector('#glyph-search-results');
      if(searchResults) searchResults.appendChild(showResult);
    });
  }

  searchGlyphNames(query){
    var results=[];
    this.files.forEach(function(file){
      if(file.indexOf(query) != -1){
        results.push({name: file.replace('.svg', ''), path: 'assets/svg/glyphs/'+file})
      }
    });
    return results;
  }

  bindToGlyphImages(){
    var _this = this;
    var glyphs = document.querySelectorAll('.glyph');
    glyphs.forEach(function(glyph){
      glyph.addEventListener('click', function(e){
        _this.handleGlyphSelectUI(e);
        _this.addGlyphToInstruction(this);
        app.noteControls.checkForNotification();
      });
    });
  }

  initListeners(){
    var _this = this;
    var glyphSearch = document.querySelector('#glyph-search');
    if(glyphSearch){
      glyphSearch.addEventListener('keyup', function(){
        var searchResults = document.querySelector('#glyph-search-results');
        if(searchResults) searchResults.innerHTML = '';

        if(this.value != ''){
          var results = _this.searchGlyphNames(this.value);
          _this.populateResults(results);

          // Remove old click handlers and rebind
          var glyphs = document.querySelectorAll('.glyph');
          glyphs.forEach(function(glyph){
            var clone = glyph.cloneNode(true);
            glyph.parentNode.replaceChild(clone, glyph);
          });
          _this.bindToGlyphImages();
        }
      });
    }

    var glyphSearchClear = document.querySelector('#glyph-search-clear');
    if(glyphSearchClear){
      glyphSearchClear.addEventListener('click', function(){
        var glyphSearch = document.querySelector('#glyph-search');
        var searchResults = document.querySelector('#glyph-search-results');
        if(glyphSearch){
          glyphSearch.value = '';
          glyphSearch.focus();
        }
        if(searchResults) searchResults.innerHTML = '';
      });
    }

    var noteGrid = document.querySelector('.note-grid');
    if(noteGrid){
      noteGrid.addEventListener('click', function(e){
        e.preventDefault();
        _this.addToNote = true;
        var glyphsModal = document.querySelector('#glyphs');
        if(glyphsModal) $(glyphsModal).foundation('reveal', 'open'); // Phase 7: Foundation modal
        setTimeout(function() {
          var glyphSearch = document.querySelector('#glyph-search');
          if(glyphSearch) glyphSearch.focus();
        }, 600); //we have to wait for the modal to be visible before we can assign focus
      });
    }

    //TODO fill out this todo, you know you wanna.
    var glyphGrid = document.querySelector('.glyph-grid');
    if(glyphGrid){
      glyphGrid.addEventListener('click', function(e){
        e.preventDefault();
        if(this.classList.contains('undo')){
          if(e.shiftKey){
            // NOTE this module should only know about the roadbook
            app.roadbook.currentlyEditingWaypoint.tulip.beginRemoveGlyph();
          }else{
            // NOTE this module should only know about the roadbook
            app.roadbook.currentlyEditingWaypoint.tulip.removeLastGlyph();
          }
          return false
        }
        _this.showGlyphModal(this.dataset.top, this.dataset.left);
        return false
      });
    }
  }

  showGlyphModal(top,left){
    app.glyphPlacementPosition = {top: top, left: left};
    this.addToNote = false;
    var glyphsModal = document.querySelector('#glyphs');
    if(glyphsModal) $(glyphsModal).foundation('reveal', 'open'); // Phase 7: Foundation modal
    setTimeout(function() {
      var glyphSearch = document.querySelector('#glyph-search');
      if(glyphSearch) glyphSearch.focus();
    }, 600); //we have to wait for the modal to be visible before we can assign focus
    return false
  }

  addGlyphToInstruction(element){
    var src = element.getAttribute('src');
    if(this.addToNote){
      // NOTE this module should only know about the roadbook
      var img = document.createElement('img');
      img.setAttribute('src', src);
      img.classList.add('normal');
      app.roadbook.appendGlyphToNoteTextEditor(img);
    } else {
      // NOTE this module should only know about the roadbook
      app.roadbook.currentlyEditingWaypoint.tulip.addGlyph(app.glyphPlacementPosition,src);
    }
  }

};
