/*
  ============================================================================
  Keyboard Controller
  ============================================================================

  RESPONSIBILITIES:
  - Handle all IPC keyboard shortcut events from main process
  - Route keyboard shortcuts to appropriate controllers
  - Handle track editing shortcuts (Cmd+1-8, Cmd+Opt+1-5)
  - No business logic, just event routing

  DEPENDENCIES:
  - IPCService (Phase 2)
  - RoadbookFileController
  - UIController
  - SettingsController (Phase 9)
  - HelpController (Phase 10)
  - MapController
  - Roadbook model
  - GlyphControls

  Refactored from application.js IPC listeners to reduce file size
*/

class KeyboardController {
  constructor(options) {
    this.ipcService = options.ipcService;
    this.fileController = options.fileController;
    this.uiController = options.uiController;
    this.settingsController = options.settingsController;
    this.helpController = options.helpController;
    this.mapController = options.mapController;
    this.roadbook = options.roadbook;
    this.glyphControls = options.glyphControls;

    this.bindIPCListeners();
  }

  /**
   * Bind all IPC keyboard shortcut listeners
   */
  bindIPCListeners() {
    const _this = this;

    // ========================================================================
    // File Operations
    // ========================================================================

    // Get documents path for saving
    this.ipcService.on('documents-path', function(event, arg){
      var path = arg+'/';
      path += _this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : _this.roadbook.name().replace(/\s/g, '-');
      _this.fileController.showSaveDialog('Save roadbook', path);
    });

    // Save roadbook (Cmd+S / Ctrl+S)
    this.ipcService.on('save-roadbook', function(event, arg){
      _this.fileController.saveRoadBook();
    });

    // Save roadbook as (Cmd+Shift+S / Ctrl+Shift+S)
    this.ipcService.on('save-roadbook-as', function(event, arg){
      _this.fileController.saveRoadBookAs();
    });

    // Open roadbook (Cmd+O / Ctrl+O)
    this.ipcService.on('open-roadbook', function(event, arg){
      _this.fileController.openRoadBook();
    });

    // ========================================================================
    // View Operations
    // ========================================================================

    // Reload (Cmd+R / Ctrl+R)
    this.ipcService.on('reload-roadbook', function(event, arg){
      location.reload();
    });

    // Toggle roadbook panel (Cmd+B / Ctrl+B)
    this.ipcService.on('toggle-roadbook', function(event, arg){
      _this.uiController.toggleRoadbook();
    });

    // Zoom in (Cmd+Plus / Ctrl+Plus)
    this.ipcService.on('zoom-in', function(event, arg){
      _this.mapController.zin();
    });

    // Zoom out (Cmd+- / Ctrl+-)
    this.ipcService.on('zoom-out', function(event, arg){
      _this.mapController.zout();
    });

    // ========================================================================
    // Import/Export Operations
    // ========================================================================

    // Import GPX (Cmd+I / Ctrl+I)
    this.ipcService.on('import-gpx', function(event, arg){
      _this.fileController.importGPX();
    });

    // Export GPX (Cmd+E / Ctrl+E)
    this.ipcService.on('export-gpx', function(event, arg){
      _this.fileController.exportGPX();
    });

    // Export OpenRally GPX (Cmd+Shift+E / Ctrl+Shift+E)
    this.ipcService.on('export-openrally-gpx', function(event, arg){
      _this.fileController.exportOpenRallyGPX();
    });

    // Export PDF (Cmd+P / Ctrl+P)
    this.ipcService.on('export-pdf', function(event, arg){
      _this.fileController.printRoadbook();
    });

    // Export lexicon
    this.ipcService.on('export-lexicon', function(event, arg){
      _this.fileController.printLexicon();
    });

    // ========================================================================
    // Settings & Help
    // ========================================================================

    // Open settings (Cmd+, / Ctrl+,)
    this.ipcService.on('open-settings', function(event, arg){
      _this.settingsController.openSettings();
    });

    // Open help (Cmd+? / F1)
    this.ipcService.on('open-help', function(event, arg){
      _this.helpController.openHelp();
    });

    // ========================================================================
    // Track Editing Shortcuts
    // ========================================================================

    // Add tracks at specific angles (Cmd+1-8 / Ctrl+1-8)
    this.ipcService.on('add-track-0', function(event, arg){
      _this.addTrackToCurrentWaypoint(0);
    });

    this.ipcService.on('add-track-45', function(event, arg){
      _this.addTrackToCurrentWaypoint(45);
    });

    this.ipcService.on('add-track-90', function(event, arg){
      _this.addTrackToCurrentWaypoint(90);
    });

    this.ipcService.on('add-track-135', function(event, arg){
      _this.addTrackToCurrentWaypoint(135);
    });

    this.ipcService.on('add-track-180', function(event, arg){
      _this.addTrackToCurrentWaypoint(180);
    });

    this.ipcService.on('add-track-225', function(event, arg){
      _this.addTrackToCurrentWaypoint(225);
    });

    this.ipcService.on('add-track-270', function(event, arg){
      _this.addTrackToCurrentWaypoint(270);
    });

    this.ipcService.on('add-track-315', function(event, arg){
      _this.addTrackToCurrentWaypoint(315);
    });

    // Set track types (Cmd+Opt+1-5 / Ctrl+Alt+1-5)
    this.ipcService.on('set-track-hp', function(event, arg){
      _this.setTrackType('offPiste');
    });

    this.ipcService.on('set-track-p', function(event, arg){
      _this.setTrackType('track');
    });

    this.ipcService.on('set-track-pp', function(event, arg){
      _this.setTrackType('road');
    });

    this.ipcService.on('set-track-ro', function(event, arg){
      _this.setTrackType('mainRoad');
    });

    this.ipcService.on('set-track-dcw', function(event, arg){
      _this.setTrackType('dcw');
    });

    // Add glyph (Cmd+Opt+G / Ctrl+Alt+G)
    this.ipcService.on('add-glyph', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.glyphControls.showGlyphModal(30, 30);
      }
    });
  }

  /**
   * Add track at specified angle to currently editing waypoint
   * @param {number} angle - Track angle in degrees
   */
  addTrackToCurrentWaypoint(angle) {
    if(this.roadbook.currentlyEditingWaypoint){
      this.roadbook.currentlyEditingWaypoint.tulip.addTrack(angle);
    }
  }

  /**
   * Set track type for currently editing waypoint
   * @param {string} type - Track type (offPiste, track, road, mainRoad, dcw)
   */
  setTrackType(type) {
    if(this.roadbook.currentlyEditingWaypoint){
      this.roadbook.currentlyEditingWaypoint.changeAddedTrackType(type);
    }
  }
}
