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

    /*
      Create EventBus (Phase 5: Service-Oriented Architecture)
      Enables decoupled component communication
    */
    this.eventBus = new EventBus();

    /*
      instantiate import/export (must be before initServices)
    */
    this.io = new Io();

    /*
      instantiate the roadbook
    */
    this.roadbook = new Roadbook();

    /*
      Initialize Services (Phase 2: Service-Oriented Architecture)
    */
    this.initServices();

    /*
      initialize UI listeners
    */
    this.initListeners();

    this.glyphControls = new GlyphControls();

    this.noteControls = new NoteControls();

    /*
      Initialize Controllers (Phase 4: Service-Oriented Architecture)
    */
    this.initControllers();

    /*
      Initialize Event Listeners (Phase 5: Service-Oriented Architecture)
    */
    this.initEventListeners();

    /*
      Initialize Settings (Phase 9: Service-Oriented Architecture)
    */
    this.initSettings();
  },

  /*
    ---------------------------------------------------------------------------
    Initialize Services (Phase 2)
    Following the Service-Oriented Architecture pattern
    ---------------------------------------------------------------------------
  */
  initServices: function() {
    // Create core services
    this.fileService = new FileService();
    this.dialogService = new DialogService();
    this.mapService = new MapService();
    this.ipcService = new IPCService();

    // ExportService depends on Io and FileService
    this.exportService = new ExportService(this.io, this.fileService);

    // Keep legacy references for backward compatibility during transition
    this.dialog = this.dialogService.dialog;
    this.fs = this.fileService.fs;
    this.ipc = this.ipcService.ipc;
  },

  /*
    ---------------------------------------------------------------------------
    Initialize Settings
    Following the Service-Oriented Architecture pattern from Phase 9
    ---------------------------------------------------------------------------
  */
  initSettings: function() {
    var _this = this;

    // Create service, model, view, and controller
    this.settingsService = new SettingsService();
    this.settings = new Settings();
    this.settingsView = new SettingsView();
    this.settingsController = new SettingsController(
      this.settingsService,
      this.settings,
      this.settingsView,
      this.dialog
    );

    // Phase 10: Help System
    this.helpService = new HelpService();
    this.help = new Help(this.helpService);
    this.helpView = new HelpView();
    this.helpController = new HelpController(
      this.help,
      this.helpView,
      this.eventBus
    );

    // Check if api_keys.js exists, if not, open settings for first-time setup
    this.checkApiKeysOnStartup();
  },

  /*
    Check if api_keys.js exists on startup
    If not, automatically open settings for first-time setup
  */
  checkApiKeysOnStartup: async function() {
    var _this = this;

    try {
      var fileExists = await this.settingsService.fileExists();

      if (!fileExists) {
        // Wait a moment for the app to fully load
        setTimeout(function() {
          _this.settingsController.openSettings(true); // true = first-time setup
        }, 500);
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
    }
  },

  /*
    ---------------------------------------------------------------------------
    Initialize Controllers (Phase 4)
    Following the Service-Oriented Architecture pattern
    ---------------------------------------------------------------------------
  */
  initControllers: function() {
    // Create UIController first (other controllers need it)
    this.uiController = new UIController(this.eventBus);

    // Create RoadbookController - coordinates roadbook file operations and exports
    this.roadbookController = new RoadbookController(
      this.roadbook,
      this.fileService,
      this.exportService,
      this.dialogService,
      this.ipcService,
      this.eventBus,
      this.uiController
    );

    // Create WaypointController - coordinates waypoint editing operations
    this.waypointController = new WaypointController(
      this.roadbook,
      this.uiController,
      this.eventBus
    );
  },

  /*
    ---------------------------------------------------------------------------
    Initialize Event Listeners (Phase 5)
    Following the Service-Oriented Architecture pattern
    ---------------------------------------------------------------------------
  */
  initEventListeners: function() {
    var _this = this;

    // Log all events for debugging (can remove later)
    this.eventBus.on(EventBus.Events.ROADBOOK_LOADED, function(data) {
      console.log('[EventBus] Roadbook loaded:', data.filePath);
    });

    this.eventBus.on(EventBus.Events.ROADBOOK_SAVED, function(data) {
      console.log('[EventBus] Roadbook saved');
    });

    this.eventBus.on(EventBus.Events.EXPORT_COMPLETED, function(data) {
      console.log('[EventBus] Export completed:', data.type, data.outputPath);
    });

    this.eventBus.on(EventBus.Events.WAYPOINT_EDITING, function(data) {
      console.log('[EventBus] Waypoint editing started');
    });

    this.eventBus.on(EventBus.Events.WAYPOINT_EDIT_FINISHED, function(data) {
      console.log('[EventBus] Waypoint editing finished');
    });

    this.eventBus.on(EventBus.Events.ERROR_OCCURRED, function(data) {
      console.error('[EventBus] Error occurred in', data.context, ':', data.error);
    });
  },

  /*
    ---------------------------------------------------------------------------
    App persistence
    TODO create a persistence module and move this into it.
    ---------------------------------------------------------------------------
  */

  canExport: function(){
    // Delegate to RoadbookController (Phase 4)
    return this.roadbookController.canExport();
  },

  canSave: function(){
    // Delegate to RoadbookController (Phase 4)
    return this.roadbookController.canSave();
  },

  openRoadBook: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.openRoadbook();
  },

  exportGPX: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.exportGPX();
  },

  exportOpenRallyGPX: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.exportOpenRallyGPX();
  },

  importGPX: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.importGPX();
  },

  printRoadbook: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.printRoadbook();
  },

  printLexicon: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.printLexicon();
  },
  saveRoadBook: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.saveRoadbook();
  },

  saveRoadBookAs: function(){
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.saveRoadbookAs();
  },

  showSaveDialog: function(title, path) {
    // Delegate to RoadbookController (Phase 4)
    this.roadbookController.showSaveDialog(title, path);
  },

  startLoading: function(){
    var _this = this;
    // Delegate to UIController (Phase 4)
    this.uiController.showLoading();
    google.maps.event.addListener(this.mapController.map, 'idle', function() {
      _this.stopLoading();
    });
  },

  stopLoading: function(){
    // Delegate to UIController (Phase 4)
    this.uiController.hideLoading();
  },

  initMap: function(){
    this.mapModel = new MapModel();
    this.mapController = new MapController(this.mapModel);
    this.mapController.placeMapAttribution();
  },

  toggleRoadbook: function(){
    // Delegate to UIController (Phase 4)
    this.uiController.toggleRoadbook();
  },

  /*
    ---------------------------------------------------------------------------
    Roadbook Listeners
    ---------------------------------------------------------------------------
  */
initListeners: function(){

  var _this = this;

  // Import GPX
  document.querySelector("#import-gpx").addEventListener('click', function(){
    _this.importGPX();
  });

  // Toggle roadbook
  document.querySelector('#toggle-roadbook').addEventListener('click', function(){
    _this.toggleRoadbook();
    this.blur();
  });

  // Export GPX
  document.querySelector('#export-gpx').addEventListener('click', function(){
    _this.exportGPX();
  });

  // Export OpenRally GPX
  document.querySelector('#export-openrally-gpx').addEventListener('click', function(){
    _this.exportOpenRallyGPX();
  });

  // New roadbook
  document.querySelector('#new-roadbook').addEventListener('click', function(){
    //TODO Something less hacky please
    location.reload();
  });

  // Open roadbook
  document.querySelector('#open-roadbook').addEventListener('click', function(){
    _this.openRoadBook();
  });

  // Print roadbook
  document.querySelector('#print-roadbook').addEventListener('click', function(){
    _this.printRoadbook();
  });

  // Print lexicon
  document.querySelector('#print-lexicon').addEventListener('click', function(){
    _this.printLexicon();
  });

  // Open settings
  document.querySelector('#open-settings').addEventListener('click', function(){
    _this.settingsController.openSettings();
    _this.uiController.closeMenu();
  });

  // Open help
  document.querySelector('#open-help').addEventListener('click', function(){
    _this.helpController.openHelp();
    _this.uiController.closeMenu();
  });

  // Save roadbook
  document.querySelector('#save-roadbook').addEventListener('click', function(e){
    e.preventDefault();
    if(_this.canSave()){
      this.classList.add('secondary');
      if(e.shiftKey){
        _this.saveRoadBookAs();
      }else {
        _this.saveRoadBook();
      }
    }
    this.blur();
  });

  // Show name/description editor
  var showEditors = document.querySelectorAll('#roadbook-desc a.show-editor, #roadbook-name a.show-editor');
  showEditors.forEach(function(editor){
    editor.addEventListener('click', function(){
      var type = this.classList.contains('rb-name') ? 'name' : 'desc';
      _this.uiController.showNameDescEditor(type);
    });
  });

  // Hide name/description editor
  var hideEditors = document.querySelectorAll('#roadbook-desc a.hide-editor, #roadbook-name a.hide-editor');
  hideEditors.forEach(function(editor){
    editor.addEventListener('click', function(){
      var type = this.classList.contains('rb-name') ? 'name' : 'desc';
      _this.uiController.hideNameDescEditor(type);
    });
  });

  /*
    Waypoint palette
  */
  document.querySelector('#hide-palette').addEventListener('click', function(){
    _this.roadbook.finishWaypointEdit();
  });

  document.querySelector('#toggle-heading').addEventListener('change', function(){
    var noteContainer = document.querySelector('#note-editor-container');
    var showHeading = _this.roadbook.waypointShowHeading();
    if(noteContainer){
      if(!showHeading){
        noteContainer.classList.add('hideCap');
      } else {
        noteContainer.classList.remove('hideCap');
      }
    }
    _this.roadbook.currentlyEditingWaypoint.showHeading(showHeading);
  });

  // Track grid clicks
  var trackGrids = document.querySelectorAll('.track-grid');
  trackGrids.forEach(function(grid){
    grid.addEventListener('click', function(e){
      if(this.classList.contains('undo')){
        if(e.shiftKey){
          _this.roadbook.currentlyEditingWaypoint.tulip.beginRemoveTrack();
        }else{
          _this.roadbook.currentlyEditingWaypoint.tulip.removeLastTrack();
        }
        return;
      }
      var angle = this.dataset.angle;
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(angle);
    });
  });

  // Added track selectors
  var addedTrackSelectors = document.querySelectorAll('.added-track-selector');
  addedTrackSelectors.forEach(function(selector){
    selector.addEventListener('click', function(e){
      e.preventDefault();
      var trackType = {
        'off-piste-added': 'offPiste',
        'track-added': 'track',
        'road-added': 'road',
        'main-road-added': 'mainRoad',
        'dcw-added': 'dcw'
      }[this.id];

      if(trackType){
        _this.roadbook.changeEditingWaypointAdded(trackType);
      }

      // Remove active from all, add to this one
      addedTrackSelectors.forEach(function(s){ s.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  // Entry track selectors
  var entryTrackSelectors = document.querySelectorAll('.entry-track-selector');
  entryTrackSelectors.forEach(function(selector){
    selector.addEventListener('click', function(e){
      e.preventDefault();
      var trackType = {
        'off-piste-entry': 'offPiste',
        'track-entry': 'track',
        'road-entry': 'road',
        'main-road-entry': 'mainRoad',
        'dcw-entry': 'dcw'
      }[this.id];

      if(trackType){
        _this.roadbook.changeEditingWaypointEntry(trackType);
      }
    });
  });

  // Exit track selectors
  var exitTrackSelectors = document.querySelectorAll('.exit-track-selector');
  exitTrackSelectors.forEach(function(selector){
    selector.addEventListener('click', function(e){
      e.preventDefault();
      var trackType = {
        'off-piste-exit': 'offPiste',
        'track-exit': 'track',
        'road-exit': 'road',
        'main-road-exit': 'mainRoad',
        'dcw-exit': 'dcw'
      }[this.id];

      if(trackType){
        _this.roadbook.changeEditingWaypointExit(trackType);
      }
    });
  });

  // Toggle insert type (track/glyph)
  var toggleInsertType = document.querySelector('[name="toggle-insert-type"]');
  if(toggleInsertType){
    toggleInsertType.addEventListener('change', function(){
      document.querySelector('.track-selection').classList.toggle('hidden');
      document.querySelector('.glyph-selection').classList.toggle('hidden');
    });
  }

  /*
    Escape key exits delete modes
  */
  document.addEventListener('keyup', function(e) {
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
  });

  /*
    IPC listeners
  */
  // Listener to get path to documents directory from node for saving roadbooks
  // NOTE only use this for roadbooks which haven't been named
  this.ipcService.on('documents-path', function(event, arg){
    var path = arg+'/';
    path += _this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : _this.roadbook.name().replace(/\s/g, '-');
    _this.showSaveDialog('Save roadbook', path);
  });

  this.ipcService.on('save-roadbook', function(event, arg){
    _this.saveRoadBook();
  });

  this.ipcService.on('save-roadbook-as', function(event, arg){
    _this.saveRoadBookAs();
  });

  this.ipcService.on('open-roadbook', function(event, arg){
    _this.openRoadBook();
  });

  this.ipcService.on('reload-roadbook', function(event, arg){
    location.reload();
  });

  this.ipcService.on('toggle-roadbook', function(event, arg){
    _this.toggleRoadbook();
  });

  this.ipcService.on('import-gpx', function(event, arg){
    _this.importGPX();
  });

  this.ipcService.on('export-gpx', function(event, arg){
    _this.exportGPX();
  });

  this.ipcService.on('export-openrally-gpx', function(event, arg){
    _this.exportOpenRallyGPX();
  });

  this.ipcService.on('export-pdf', function(event, arg){
    _this.printRoadbook();
  });

  this.ipcService.on('export-lexicon', function(event, arg){
    _this.printLexicon();
  });

  this.ipcService.on('open-settings', function(event, arg){
    _this.settingsController.openSettings();
  });

  this.ipcService.on('open-help', function(event, arg){
    _this.helpController.openHelp();
  });

  this.ipcService.on('zoom-in', function(event, arg){
    _this.mapController.zin();
  });

  this.ipcService.on('zoom-out', function(event, arg){
    _this.mapController.zout();
  });

  this.ipcService.on('add-glyph', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.glyphControls.showGlyphModal(30,30);
    }
  });

  this.ipcService.on('add-track-0', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(0);
    }
  });

  this.ipcService.on('add-track-45', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(45);
    }
  });

  this.ipcService.on('add-track-90', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(90);
    }
  });

  this.ipcService.on('add-track-135', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(135);
    }
  });

  this.ipcService.on('add-track-180', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(180);
    }
  });

  this.ipcService.on('add-track-225', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(225);
    }
  });

  this.ipcService.on('add-track-270', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(270);
    }
  });

  this.ipcService.on('add-track-315', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.addTrack(315);
    }
  });

  this.ipcService.on('remove-track', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.currentlyEditingWaypoint.tulip.removeLastTrack();
    }
  });

  this.ipcService.on('set-track-off-piste', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.changeEditingWaypointAdded('offPiste');
      var addedSelectors = document.querySelectorAll('.added-track-selector');
      addedSelectors.forEach(function(s){ s.classList.remove('active'); });
      if(addedSelectors[0]) addedSelectors[0].classList.add('active');
    }
  });

  this.ipcService.on('set-track-track', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.changeEditingWaypointAdded('track');
      var addedSelectors = document.querySelectorAll('.added-track-selector');
      addedSelectors.forEach(function(s){ s.classList.remove('active'); });
      if(addedSelectors[1]) addedSelectors[1].classList.add('active');
    }
  });

  this.ipcService.on('set-track-road', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.changeEditingWaypointAdded('road');
      var addedSelectors = document.querySelectorAll('.added-track-selector');
      addedSelectors.forEach(function(s){ s.classList.remove('active'); });
      if(addedSelectors[2]) addedSelectors[2].classList.add('active');
    }
  });

  this.ipcService.on('set-track-main-road', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.changeEditingWaypointAdded('mainRoad');
      var addedSelectors = document.querySelectorAll('.added-track-selector');
      addedSelectors.forEach(function(s){ s.classList.remove('active'); });
      console.log(addedSelectors[3]);
      if(addedSelectors[3]) addedSelectors[3].classList.add('active');
    }
  });

  this.ipcService.on('set-track-dcw', function(event, arg){
    if(_this.roadbook.currentlyEditingWaypoint){
      _this.roadbook.changeEditingWaypointAdded('dcw');
      var addedSelectors = document.querySelectorAll('.added-track-selector');
      addedSelectors.forEach(function(s){ s.classList.remove('active'); });
      if(addedSelectors[4]) addedSelectors[4].classList.add('active');
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
