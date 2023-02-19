const { ipcRenderer } = require('electron');
const { debuglog } = require('util');

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
  // singleton: true,

  create: function(){
    /*
      declare some state instance variables
    */
    this.glyphPlacementPosition = {top: 30,left: 30};
    this.canEditMap = true;
    this.pointDeleteMode = false;
    //Dialogs for file IO
    this.dialog = require('electron');
    /*
      instantiate the roadbook
    */
    this.roadbook = new Roadbook();

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

    this.glyphControls = new GlyphControls(process.resourcesPath);

    this.noteControls = new NoteControls();
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

  canSave: function(){
    var can;
    can = this.roadbook.finishWaypointEdit();
    can = can || this.roadbook.newWaypoints;
    can = can || this.roadbook.finishNameDescEdit();
    return can;
  },

  openRoadBook: function(){
    var _this = this;
    var options = {
      filters: [{ name: 'tulip', extensions: ['tlp'] }],
      multiSelections: false
    }
    ipcRenderer.send('show-open-dialog', options)
    ipcRenderer.on('read-file', (event, fileName) => {
      if (fileName === undefined) return
      _this.startLoading();
      //TODO this needs to be passed to create when choice is added
      //we need to figure out how to watch a file while it's being edited so if it's moved it gets saved to the right place ***fs.watch***
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
    })
  },

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

  exportOpenRallyGPX: function(){
    if(this.canExport()){
      var gpx = this.io.exportOpenRallyGPX();
      var filename = this.roadbook.filePath.replace('.tlp','-openrally.gpx');
      this.fs.writeFile(filename, gpx, function (err) {});
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      alert('You gpx has been exported to the same directory you saved your roadbook');
    } else {
      alert('F@#k1ng Kamaz! You must save your roadbook before you can export GPX tracks');
    }
  },

  importGPX: function(){
    var _this = this;
    var options = {
      filters: [{ name: 'import gpx', extensions: ['gpx'] }],
      multiSelections: false
    }
    ipcRenderer.send('show-open-dialog', options)
    ipcRenderer.on('read-file', (event, fileName) => {
      if (fileName === undefined) return
      var fs = require('fs');
      _this.startLoading();
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      _this.fs.readFile(fileName, 'utf-8', function (err, data) {
        _this.io.importGPX(data);
      })
    })
  },

  printRoadbook: function(){
    if(this.canExport()){
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      this.ipc.send('ignite-print',app.roadbook.statelessJSON());
    } else {
      alert('You must save your roadbook before you can export it as a PDF');
    }
  },
  printLexicon: function(){
	if(this.canExport()){
		$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
		this.ipc.send('ignite-lexicon',app.roadbook.filePath);
	}else {
      alert('You must save your roadbook before you can save the Lexicon. No, really. Sorry.');
    }
  },
  saveRoadBook: function(){
    if(this.roadbook.filePath == null){
      // Request documents directory path from node
      this.ipc.send('get-documents-path');
    } else {
      this.roadbook.finishWaypointEdit();
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
    path = path + ".tlp";
    options = {
      title: title,
      defaultPath: path,
      showOverwriteConfirmation: true,
      filters: [{ name: 'tulip', extensions: ['tlp'] }]
    }

    ipcRenderer.send('show-save-dialog', options)
    ipcRenderer.on('save-file', (event, filePath) => {
      console.log("Saving file ", filePath)

      if (filePath === undefined) return
        var tulipFile = _this.roadbook.statefulJSON();
        tulipFile.filePath = filePath;
        _this.roadbook.filePath = filePath;
        tulipFile = JSON.stringify(tulipFile, null, 2);
        _this.fs.writeFile(filePath, tulipFile, function (err) {});
        return true
    })
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
    $('#print-lexicon').click(function(){
      _this.printLexicon();
    });

    $('#save-roadbook').click(function(e){
      e.preventDefault();
      if(_this.canSave()){
        $(this).addClass('secondary');
        if(e.shiftKey){
          _this.saveRoadBookAs();
        }else {
          _this.saveRoadBook();
        }
      }
      $(this).blur();
    });

    $('#roadbook-desc, #roadbook-name').find('a.show-editor').click(function(){
      $(this).hide();
      $(this).siblings('.hide-editor').show();
      $(this).siblings('.roadbook-header-input-container').slideDown('fast');
      if($(this).hasClass('rb-name')){
        $(this).parent('div').find(':input').focus();
      }
      if($(this).hasClass('rb-desc')){
        $('#roadbook-desc p').slideUp('fast');
        _this.roadbook.descriptionTextEditor.focus();
      }
      $('#save-roadbook').removeClass('secondary');
      _this.roadbook.editingNameDesc = true;
    });

    $('#roadbook-desc, #roadbook-name').find('a.hide-editor').click(function(){
      $(this).hide();
      $(this).siblings('.show-editor').show();
      $(this).siblings('.roadbook-header-input-container').slideUp('fast');
      if($(this).hasClass('rb-desc')){
        $('#roadbook-desc p').slideDown('fast');
      }
    });

    /*
      Waypoint palette
    */
    $('#hide-palette').click(function(){
      _this.roadbook.finishWaypointEdit();
    });

    $('#toggle-heading').change(function(){
      $('#note-editor-container').toggleClass('hideCap',!_this.roadbook.waypointShowHeading())
      _this.roadbook.currentlyEditingWaypoint.showHeading(_this.roadbook.waypointShowHeading());
    });

    $('.track-grid').click(function(e){
      if($(this).hasClass('undo')){
        if(e.shiftKey){
          _this.roadbook.currentlyEditingWaypoint.tulip.beginRemoveTrack();
        }else{
          _this.roadbook.currentlyEditingWaypoint.tulip.removeLastTrack();
        }
        return
      }
      var angle = $(this).data('angle');
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(angle);
    });

    // TODO change to object literal lookup
    $('.added-track-selector').click(function(e) {
      e.preventDefault();
      if('off-piste-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('offPiste')
      }else if('track-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('track')
      }else if('road-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('road')
      }else if('main-road-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('mainRoad')
      }else if('dcw-added' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointAdded('dcw')
      }

      $('.added-track-selector').removeClass('active');
      $(this).addClass('active');
    });

    $('.entry-track-selector').click(function(e) {
      e.preventDefault();
      if('off-piste-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('offPiste')
      }else if('track-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('track')
      }else if('road-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('road')
      }else if('main-road-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('mainRoad')
      }else if('dcw-entry' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointEntry('dcw')
      }
    });

    $('.exit-track-selector').click(function(e) {
      e.preventDefault();
      if('off-piste-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('offPiste')
      }else if('track-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('track')
      }else if('road-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('road')
      }else if('main-road-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('mainRoad')
      }else if('dcw-exit' == $(this).attr('id')){
        _this.roadbook.changeEditingWaypointExit('dcw')
      }
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
        if(_this.roadbook.currentlyEditingWaypoint){
          _this.roadbook.currentlyEditingWaypoint.tulip.finishRemove();
          _this.roadbook.currentlyEditingWaypoint.tulip.beginEdit();
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

    this.ipc.on('export-gpx', function(event, arg){
      _this.exportGPX();
    });

    this.ipc.on('export-openrally-gpx', function(event, arg){
      _this.exportOpenRallyGPX();
    });

    this.ipc.on('export-pdf', function(event, arg){
      _this.printRoadbook();
    });

	this.ipc.on('export-lexicon', function(event, arg){
      _this.printLexicon();
    });
	
    this.ipc.on('zoom-in', function(event, arg){
      _this.mapController.zin();
    });

    this.ipc.on('zoom-out', function(event, arg){
      _this.mapController.zout();
    });

    this.ipc.on('add-glyph', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.glyphControls.showGlyphModal(30,30);
      }
    });

    this.ipc.on('add-track-0', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(0);
      }
    });

    this.ipc.on('add-track-45', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(45);
      }
    });

    this.ipc.on('add-track-90', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(90);
      }
    });

    this.ipc.on('add-track-135', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(135);
      }
    });

    this.ipc.on('add-track-180', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(180);
      }
    });

    this.ipc.on('add-track-225', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(225);
      }
    });

    this.ipc.on('add-track-270', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(270);
      }
    });

    this.ipc.on('add-track-315', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(315);
      }
    });

    this.ipc.on('set-track-hp', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('offPiste');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[0]).addClass('active');
      }
    });

    this.ipc.on('set-track-p', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('track');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[1]).addClass('active');
      }
    });

    this.ipc.on('set-track-pp', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('road');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[2]).addClass('active');
      }
    });

    this.ipc.on('set-track-ro', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('mainRoad');
        $('.added-track-selector').removeClass('active');
        console.log($('.added-track-selector')[3]);
        $($('.added-track-selector')[3]).addClass('active');
      }
    });

    this.ipc.on('set-track-dcw', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('dcw');
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
