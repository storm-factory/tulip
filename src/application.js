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
    MapController and MapModel objects. The MapController creates Waypoints based off interaction.
    Each Waypoint has a Tulip which is uses the TrackEditor class to handle the complexity
    of editing tracks.
  ---------------------------------------------------------------------------
*/
var App = Class({
  // singleton: true,

  create: function(){
    /*
      declare some state instance variables
    */
    this.glyphPlacementPosition = {top: 30,left: 30};
    this.canEditMap = true;
    this.pointDeleteMode = false;
    //Dialogs for file IO
    this.dialog = require('electron').remote.dialog;
    /*
      instantiate the roadbook
      TODO rename variable
    */
    this.roadbook = new RoadbookModel();
    this.roadbook.bindToKnockout();

    // TODO: : this is weird:
    this.roadbookController = new RoadbookController(this.roadbook);
    this.roadbook.controller = this.roadbookController;
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
    this.ipc = require('electron').ipcRenderer; //TODO try require('ipcRenderer')
    /*
      initialize UI listeners
    */
    this.initListeners();

    this.glyphManager = new GlyphFileManager();
    // this.glyphControls = new GlyphControls(); //TODO fix IPC function
    this.tulipPaletteController = new TulipPaletteController(this.roadbook, this.glyphManager);
    // this.noteControls = new NoteControls();
    this.notePaletteController = new NotePaletteController(this.roadbook, this.glyphManager);
  },

  /*
    ---------------------------------------------------------------------------
    App persistence
    TODO create a persistence module and move this into it.
    ---------------------------------------------------------------------------
  */

  canExport: function(){
    var can;
    can = this.roadbook.filePath != null;
    return can
  },

  openRoadBook: function(){
    var _this = this;
    this.dialog.showOpenDialog({ filters: [
       { name: 'tulip', extensions: ['tlp'] }
      ]},function (fileNames) {
      var fs = require('fs');
      if (fileNames === undefined) return;
        _this.startLoading();
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
        $('#export-openrally-gpx').removeClass('disabled')
    });
  },

  // TODO make a select box that asks if you want RB classic, Open rally, or straight gpx
  exportGPX: function(){
    if(this.canExport()){
      var gpx = this.io.exportGPX();
      var filename = this.roadbook.filePath.replace('tlp','gpx');
      this.fs.writeFile(filename, gpx, function (err) {});
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      alert('You gpx has been exported to the same directory you saved your roadbook');
    } else {
      alert('F@#k1ng Kamaz! You must save your roadbook before you can export GPX tracks');
    }
  },

  // exportOpenRallyGPX: function(){
  //   if(this.canExport()){
  //     var gpx = this.io.exportOpenRallyGPX();
  //     var filename = (this.roadbook.filePath).replace('tlp','openrally.gpx');
  //     this.fs.writeFile(filename, gpx, function (err) {});
  //     $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
  //     alert('You gpx has been exported to the same directory you saved your roadbook');
  //   } else {
  //     alert('F@#k1ng Kamaz! You must save your roadbook before you can export GPX tracks');
  //   }
  // },

  importGPX: function(reverse=false){
    var _this = this;
    this.dialog.showOpenDialog({ filters: [
       { name: 'import gpx', extensions: ['gpx'] }
      ]},function (fileNames) {
      var fs = require('fs');
      if (fileNames === undefined) return;
      _this.startLoading();
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      var fileName = fileNames[0];
      _this.fs.readFile(fileName, 'utf-8', function (err, data) {
        _this.io.importGPX(data, reverse);
      });
    });
  },

  printRoadbook: function(){
    if(this.canExport()){
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      this.ipc.send('ignite-print',app.roadbook.statelessJSON());
    } else {
      alert('You must save your roadbook before you can export it as a PDF');
    }
  },

  saveRoadBook: function(){
    this.roadbook.updateInstructionAfterEdit(this.roadbookController.getNoteEditorHTML(), this.roadbookController.getNotificationBubbleVal(), this.roadbookController.getNotificationModifierVal());
    if(this.roadbook.filePath == null){
      // Request documents directory path from node
      this.ipc.send('get-documents-path');
    } else {
      this.fs.writeFile(this.roadbook.filePath, JSON.stringify(this.roadbook.statefulJSON(), null, 2), function (err) {});
    }
  },

  saveRoadBookAs: function(){
    if(this.roadbook.filePath == null){
      // Request documents directory path from node TODO we really only need to do this once...
      this.ipc.send('get-documents-path');
    } else {
      this.showSaveDialog('Save roadbook as',this.roadbook.filePath)
    }
  },

  showSaveDialog: function(title,path) {
    var _this = this;
    this.dialog.showSaveDialog({
                                title: title,
                                defaultPath: path,
                                filters: [{ name: 'tulip', extensions: ['tlp'] }]
      },function (fileName) {
      if (fileName === undefined) return;
        // assign the file path to the json for first time players
        // TODO figure out what to do if the user changes the name of the file
        var tulipFile = _this.roadbook.statefulJSON();
        tulipFile.filePath = fileName;
        _this.roadbook.filePath = fileName;
        tulipFile = JSON.stringify(tulipFile, null, 2);
        _this.fs.writeFile(fileName, tulipFile, function (err) {});
        return true
    });
  },

  startLoading: function(){
    $('#loading').show();
    google.maps.event.addListener(this.mapController.map, 'idle', this.stopLoading); //TODO pass to map controller with callback
  },

  stopLoading: function(){
    $('#loading').hide();
  },

  initMap: function(){
    this.mapModel = new MapModel();
    this.mapController = new MapController(this.mapModel);
    this.mapController.placeMapAttribution();
  },

  toggleRoadbook: function(){
    $('.roadbook-container').toggleClass('collapsed');
    $('.roadbook-container').toggleClass('expanded');

    $('#toggle-roadbook i').toggleClass('fi-arrow-down');
    $('#toggle-roadbook i').toggleClass('fi-arrow-up');
  },

  /*
    ---------------------------------------------------------------------------
    Roadbook Listeners
    ---------------------------------------------------------------------------
  */
  initListeners: function(){

    var _this = this

    $("#import-gpx").click(function(){
      _this.importGPX();
    });

    $('#toggle-roadbook').click(function(){
      _this.toggleRoadbook();
      $(this).blur();
    });

    $('#export-gpx').click(function(){
      _this.exportGPX();
    });

    $('#export-openrally-gpx').click(function(){
      _this.exportOpenRallyGPX();
    });

    $('#new-roadbook').click(function(){
      //TODO Something less hacky please
      location.reload();
    });

    $('#open-roadbook').click(function(){
      _this.openRoadBook();
    });

    $('#print-roadbook').click(function(){
      _this.printRoadbook();
    });

    $('#save-roadbook').click(function(e){
      e.preventDefault();
      $(this).addClass('secondary');
      if(e.shiftKey){
        _this.saveRoadBookAs();
      }else {
        _this.saveRoadBook();
      }
      $(this).blur();
    });

    $('[name="toggle-insert-type"]').change(function(){
      $('.track-selection').toggleClass('hidden');
      $('.glyph-selection').toggleClass('hidden');
    });

    /*
      escape key exits delete modes
    */
    $(document).keyup(function(e) {
      if(e.keyCode == 27){
        if(_this.roadbook.currentlyEditingInstruction){
          _this.roadbook.currentlyEditingInstruction.tulip.finishRemove();
          _this.roadbook.currentlyEditingInstruction.tulip.beginEdit();
        }
        if(_this.mapController.markerDeleteMode == true){
          // TODO move this to the map controller
          var marker = _this.mapModel.markers[_this.mapModel.deleteQueue.pop()];
          _this.mapController.returnPointToNaturalColor(marker);
          _this.mapController.markerDeleteMode = false;
        }
      }
    })

    /*
      We're adding IPC listeners in here I guess eh?

      This super duper needs to be cleaned up
    */
    // Listener to get path to documents directory from node for saving roadbooks
    // NOTE only use this for roadbooks which haven't been named
    this.ipc.on('documents-path', function(event, arg){
      var path = arg+'/';
      path += _this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : _this.roadbook.name().replace(/\s/g, '-')
      _this.showSaveDialog('Save roadbook', path)
    });

    this.ipc.on('save-roadbook', function(event, arg){
      _this.saveRoadBook();
    });

    this.ipc.on('save-roadbook-as', function(event, arg){
      _this.saveRoadBookAs();
    });

    this.ipc.on('open-roadbook', function(event, arg){
      _this.openRoadBook();
    });

    this.ipc.on('reload-roadbook', function(event, arg){
      location.reload();
    });

    this.ipc.on('toggle-roadbook', function(event, arg){
      _this.toggleRoadbook();
    });

    this.ipc.on('import-gpx', function(event, arg){
      _this.importGPX();
    });

    this.ipc.on('import-gpx-reverse', function(event, arg){
      _this.importGPX(true);
    });

    this.ipc.on('export-gpx', function(event, arg){
      _this.exportGPX();
    });

    this.ipc.on('export-openrally-gpx', function(event, arg){
      _this.exportOpenRallyGPX();
    });

    this.ipc.on('export-pdf', function(event, arg){
      _this.printRoadbook();
    });

    this.ipc.on('zoom-in', function(event, arg){
      _this.mapController.zin();
    });

    this.ipc.on('zoom-out', function(event, arg){
      _this.mapController.zout();
    });

    this.ipc.on('add-glyph', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.glyphControls.showGlyphModal(30,30);
      }
    });

    this.ipc.on('add-track-0', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(0);
      }
    });

    this.ipc.on('add-track-45', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(45);
      }
    });

    this.ipc.on('add-track-90', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(90);
      }
    });

    this.ipc.on('add-track-135', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(135);
      }
    });

    this.ipc.on('add-track-180', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(180);
      }
    });

    this.ipc.on('add-track-225', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(225);
      }
    });

    this.ipc.on('add-track-270', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(270);
      }
    });

    this.ipc.on('add-track-315', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(315);
      }
    });

    this.ipc.on('set-track-hp', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.changeEditingInstructionAdded('offPiste');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[0]).addClass('active');
      }
    });

    this.ipc.on('set-track-p', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.changeEditingInstructionAdded('track');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[1]).addClass('active');
      }
    });

    this.ipc.on('set-track-pp', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.changeEditingInstructionAdded('road');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[2]).addClass('active');
      }
    });

    this.ipc.on('set-track-ro', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.changeEditingInstructionAdded('mainRoad');
        $('.added-track-selector').removeClass('active');
        console.log($('.added-track-selector')[3]);
        $($('.added-track-selector')[3]).addClass('active');
      }
    });

    this.ipc.on('set-track-dcw', function(event, arg){
      if(_this.roadbook.currentlyEditingInstruction){
        _this.roadbook.changeEditingInstructionAdded('dcw');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[4]).addClass('active');
      }
    });

    window.addEventListener("beforeunload", function (event) {
      if(_this.roadbook.filePath){
        var rb = JSON.stringify(this.roadbook.statefulJSON(), null, 2);
        var save = _this.dialog.showMessageBox({message: "Would you like to save before closing? All unsaved changes will be lost.", buttons: ['ok', 'nope'], type: 'question'});
        if(save == 0){
          _this.fs.writeFile(_this.roadbook.filePath, rb, function (err) {});
        }
      }
    });
  },
});
