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
      Initialize UI listeners - REFACTORED into MenuController and KeyboardController
      Old initListeners() function is deprecated but kept for reference
    */
    // this.initListeners(); // DEPRECATED - moved to MenuController + KeyboardController

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
    Also loads keys and makes them globally available
  */
  checkApiKeysOnStartup: async function() {
    var _this = this;

    try {
      var fileExists = await this.settingsService.fileExists();

      if (!fileExists) {
        // No api_keys.js file - create empty one and open settings
        await this.settingsService.writeApiKeys('', '');

        setTimeout(function() {
          _this.settingsController.openSettings(true); // true = first-time setup
        }, 500);

        // Set empty keys so app doesn't crash
        window.api_keys = Object.freeze({
          google_directions: '',
          google_maps: ''
        });
      } else {
        // Load existing keys
        var keys = await this.settingsService.readApiKeys();
        window.api_keys = Object.freeze({
          google_directions: keys.googleDirectionsKey,
          google_maps: keys.googleMapsKey
        });
      }

      // Trigger event to signal keys are loaded
      this.eventBus.emit('api-keys:loaded');
    } catch (error) {
      console.error('Error loading API keys:', error);
      // Set empty keys so app doesn't crash
      window.api_keys = Object.freeze({
        google_directions: '',
        google_maps: ''
      });
      this.eventBus.emit('api-keys:loaded');
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

    // Refactoring: Create RoadbookFileController for all file operations
    // Note: Must be created after RoadbookController
    this.fileController = new RoadbookFileController(
      this.roadbook,
      this.fileService,
      this.exportService,
      this.dialogService,
      this.roadbookController,
      this.eventBus
    );

    // Note: MapController and MapModel are created later by initMap()
    // which is called by Google Maps API callback
  },

  /*
    Initialize Menu and Keyboard controllers after map is ready
    Called from initMap() after map initialization
  */
  initUIControllers: function() {
    // Refactoring: Create MenuController to handle all menu clicks
    this.menuController = new MenuController({
      fileController: this.fileController,
      uiController: this.uiController,
      settingsController: this.settingsController,
      helpController: this.helpController,
      mapController: this.mapController,
      roadbook: this.roadbook,
      glyphControls: this.glyphControls,
      mapModel: this.mapModel
    });

    // Refactoring: Create KeyboardController to handle all keyboard shortcuts
    this.keyboardController = new KeyboardController({
      ipcService: this.ipcService,
      fileController: this.fileController,
      uiController: this.uiController,
      settingsController: this.settingsController,
      helpController: this.helpController,
      mapController: this.mapController,
      roadbook: this.roadbook,
      glyphControls: this.glyphControls
    });
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
    Legacy methods still used by other modules
    ---------------------------------------------------------------------------
  */

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

    // Initialize MenuController and KeyboardController after map is ready
    this.initUIControllers();
  }

});
