/*
  ---------------------------------------------------------------------------
  Define the application object as a singleton

  This class is the main IO interface between the user an the application

  Logically the Heirarchy of Application structure is:
    -> Application
     Modules:
     -> Mapping
      -> Roadbook
       -> Waypoint
        -> Tulip
         -> TrackEditor

    The Application handles bootstrapping the user interface and any non Mapping
    function. The UI is mainly composed of the UI Map which is managed by the
    MapEditor object. The Map Editor creates Waypoints based off interaction.
    Each Waypoint has a Tulip which is uses the TrackEditor class to handle the complexity
    of editing tracks.
  ---------------------------------------------------------------------------
*/
var App = Class({
  singleton: true,

  create: function(){
    /*
      declare some state instance variables
    */
    this.glyphPlacementPosition = {top: 30,left: 30};
    this.canEditMap = true;
    //Dialogs for file IO
    this.dialog = require('electron').remote.dialog;
    /*
      instantiate the roadbook
    */
    this.roadbook = new Roadbook();

    /*
      initialize UI listeners
    */
    this.initListeners();
    this.mapControls = MapControls.instance();
    /*
      instantiate import/export
    */
    this.io = new Io();

    /*
      file io
    */
    this.fs = require('fs');
    /*
      IPC to Main process
    */
    this.ipcRenderer = require('electron').ipcRenderer; //TODO try require('ipcRenderer')
  },

  /*
    ---------------------------------------------------------------------------
    App persistence
    TODO create a persistence module and move this into it.
    ---------------------------------------------------------------------------
  */

  canSave: function(){
    var can;
    can = this.roadbook.finishWaypointEdit();
    can = can || this.roadbook.newWaypoints;
    can = can || this.roadbook.finishNameDescEdit();
    return can;
  },

  openRoadBook: function(){
    var _this = this;
    this.dialog.showOpenDialog({ filters: [
       { name: 'tulip', extensions: ['tlp'] }
      ]},function (fileNames) {
      var fs = require('fs');
      if (fileNames === undefined) return;
        //TODO this needs to be passed to create when choice is added
        //we need to figure out how to watch a file while it's being edited so if it's moved it gets saved to the right place ***fs.watch***
        var fileName = fileNames[0];
        _this.fs.readFile(fileName, 'utf-8', function (err, data) {
          var json = JSON.parse(data);
          // We need to ask whether they want to open a new roadbook or append an existing one to the currently
          // being edited RB
          _this.roadbook.appendRouteFromJSON(json,fileName); //TODO this needs to only pass json once choice is added
        });
        $('#toggle-roadbook').click();
        $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
        $('#print-roadbook').removeClass('disabled')
        $('#export-gpx').removeClass('disabled')
    });
  },

  exportGPX: function(callback){
    var gpx = this.io.exportGPX();
    var filename = this.roadbook.filePath.replace('tlp','gpx');
    this.fs.writeFile(filename, gpx, function (err) {});
    callback();
  },

  importGPX: function(callback){
    console.log("import gpx function hasn't been written yet");
  },

  printRoadbook: function(callback){
    this.ipcRenderer.send('ignite-print',app.roadbook.statelessJSON());
    callback();
  },

  saveRoadBook: function(){
    console.log('saving');
    var _this = this
    // TODO determine users OS and derive where to save roadbooks by default (to documents or something defined at install or in preferences)
    // come up with a default directory in the preferences. this should be possible through Node IPC

    var tulipFile = this.roadbook.statefulJSON();
    if(tulipFile.filePath == null){
      var title = this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : this.roadbook.name().replace(' ', '-')
      this.dialog.showSaveDialog({
                                  title: 'Save your roadbook',
                                  defaultPath: title,
                                  filters: [{ name: 'tulip', extensions: ['tlp'] }]
        },function (fileName) {
        if (fileName === undefined) return;
          // assign the file path to the json for first time players
          // TODO figure out what to do if the user changes the name of the file
          tulipFile.filePath = fileName;
          tulipFile = JSON.stringify(tulipFile, null, 2);
          _this.fs.writeFile(fileName, tulipFile, function (err) {});
          $('#print-roadbook').removeClass('disabled')
          $('#export-gpx').removeClass('disabled')
      });
    } else {
      this.fs.writeFile(tulipFile.filePath, JSON.stringify(tulipFile, null, 2), function (err) {});
    }
  },

  startLoading: function(){
    $('#loading').show();
    google.maps.event.addListener(this.map, 'idle', this.stopLoading);
  },

  stopLoading: function(){
    $('#loading').hide();
  },

  /*
    ---------------------------------------------------------------------------
    Roadbook Listeners
    ---------------------------------------------------------------------------
  */
  initListeners: function(){

    var _this = this
    $('#draw-route').click(function(){
      _this.canEditMap = !_this.canEditMap;
      $(this).toggleClass('alert');
    });

    $("#import-gpx").click(function(){
      /*
        TODO move to own function in app
      */
      _this.dialog.showOpenDialog({ filters: [
         { name: 'import gpx', extensions: ['gpx'] }
        ]},function (fileNames) {
        var fs = require('fs');
        if (fileNames === undefined) return;
        _this.startLoading();
        $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
        var fileName = fileNames[0];
        _this.fs.readFile(fileName, 'utf-8', function (err, data) {
          _this.io.importGPX(data);
        });
      });
    });

    $('#toggle-roadbook').click(function(){
      $('.roadbook-container').toggleClass('collapsed');
      $('.roadbook-container').toggleClass('expanded');

      $('#toggle-roadbook i').toggleClass('fi-arrow-down');
      $('#toggle-roadbook i').toggleClass('fi-arrow-up');
      $(this).blur();
    });

    $('#export-gpx').click(function(){
      if($(this).hasClass('disabled')){
        alert('You must save your roadbook before you can export GPX tracks');
      } else {
        _this.exportGPX(function(){
          $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
        });
      }
    });

    $('#new-roadbook').click(function(){
      //TODO Something less hacky please
      location.reload();
    });

    $('#open-roadbook').click(function(){
      _this.openRoadBook();
    });

    $('#print-roadbook').click(function(){
      if($(this).hasClass('disabled')){
        alert('You must save your roadbook before you can export it as a PDF');
      } else {
        _this.printRoadbook(function(){
          $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
        });
      }
    });

    $('#save-roadbook').click(function(){
      if(_this.canSave()){
        $(this).addClass('secondary');
        _this.saveRoadBook();
        $('.waypoint.row').show();
        $('#waypoint-palette').hide();
        $('#roadbook-desc, #roadbook-name').find(':input').hide('fast');
        $('#roadbook-desc, #roadbook-name').find('a').show('fast');
      }
      $(this).blur();
    });

    $('#roadbook-desc, #roadbook-name').find('a').click(function(){
      $(this).hide();
      $(this).parent('div').find(':input').toggle('fast');
      var text = $(this).parent('div').find(':input').val();
      if($(this).data('default')){
        $(this).parent('div').find(':input').val('');
      } else {
        $(this).parent('div').text();
      }
      $(this).parent('div').find(':input').focus();
      $('#save-roadbook').removeClass('secondary');
      $(this).data('default', false)
      _this.roadbook.editingNameDesc = true;
    });

    $('#hide-pallette').click(function(){
      $('.waypoint.row').show();
      $('#waypoint-palette').hide();
      _this.roadbook.finishWaypointEdit();
    });

    $('.track-grid').click(function(){
      if($(this).hasClass('undo')){
        _this.roadbook.currentlyEditingWaypoint.tulip.removeLastTrack();
        return
      }
      var angle = $(this).data('angle');
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(angle);
    });

    //TODO fill out this todo, you know you wanna.
    $('.glyph-grid').click(function(){
      if($(this).hasClass('note-grid')){
        if($(this).hasClass('undo')){
          _this.roadbook.currentlyEditingWaypoint.removeLastNoteGlyph();
          return
        }
        $('.glyph').addClass('note');
        $('#glyphs').foundation('reveal', 'open');
        return
      } else{
        if($(this).hasClass('undo')){
          _this.roadbook.currentlyEditingWaypoint.tulip.removeLastGlyph();
          return
        }
        _this.glyphPlacementPosition = {top: $(this).data('top'), left: $(this).data('left')};
        $('.glyph').removeClass('note');
        $('#glyphs').foundation('reveal', 'open');
        return
      }
    });

    $('.glyph').click(function(){
      var src = $(this).attr('src');

      if($(this).hasClass('note')){
        _this.roadbook.currentlyEditingWaypoint.addNoteGlyph(src)
      } else {
        _this.roadbook.currentlyEditingWaypoint.tulip.addGlyph(_this.glyphPlacementPosition,src);
      }
      $('#glyphs').foundation('reveal', 'close');
    });

    $('.track-selector').click(function() {
      if('off-piste-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('offPiste')
      }else if('track-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('track')
      }else if('road-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('road')
      }else if('off-piste-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('offPiste')
      }else if('track-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('track')
      }else if('road-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('road')
      }else if('off-piste-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('offPiste')
      }else if('track-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('track')
      }else if('road-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('road')
      }
      $('#track-selection-modal').foundation('reveal', 'close');
    });

  },
});
/*
  ---------------------------------------------------------------------------
  Instantiate the application
  ---------------------------------------------------------------------------
*/
$(document).ready(function(){
  app = App.instance();
  ko.applyBindings(app.roadbook);
  $(document).foundation();
});
/*
  ---------------------------------------------------------------------------
  Instantiate the google map
  ---------------------------------------------------------------------------
*/
function initMap() {
  app.mapEditor = MapEditor.instance();
  app.map = app.mapEditor.map;
}
