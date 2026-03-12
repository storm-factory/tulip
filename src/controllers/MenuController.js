/*
  ============================================================================
  Menu Controller
  ============================================================================

  RESPONSIBILITIES:
  - Handle all menu click events from the UI
  - Bind DOM event listeners for menu items
  - Delegate actions to appropriate controllers
  - Handle keyboard events (Escape key)
  - No business logic, just event routing

  DEPENDENCIES:
  - RoadbookFileController
  - UIController
  - SettingsController (Phase 9)
  - HelpController (Phase 10)
  - MapController
  - Roadbook model
  - GlyphControls
  - MapModel

  Refactored from application.js initListeners() to reduce file size
*/

class MenuController {
  constructor(options) {
    this.fileController = options.fileController;
    this.uiController = options.uiController;
    this.settingsController = options.settingsController;
    this.helpController = options.helpController;
    this.mapController = options.mapController;
    this.roadbook = options.roadbook;
    this.glyphControls = options.glyphControls;
    this.mapModel = options.mapModel;

    this.bindEvents();
  }

  /**
   * Bind all menu event listeners
   */
  bindEvents() {
    const _this = this;

    // ========================================================================
    // File Menu
    // ========================================================================

    // Import GPX
    document.querySelector("#import-gpx").addEventListener('click', function(){
      _this.fileController.importGPX();
    });

    // Export GPX
    document.querySelector('#export-gpx').addEventListener('click', function(){
      _this.fileController.exportGPX();
    });

    // Export OpenRally GPX
    document.querySelector('#export-openrally-gpx').addEventListener('click', function(){
      _this.fileController.exportOpenRallyGPX();
    });

    // New roadbook
    document.querySelector('#new-roadbook').addEventListener('click', function(){
      // TODO: Something less hacky please
      location.reload();
    });

    // Open roadbook
    document.querySelector('#open-roadbook').addEventListener('click', function(){
      _this.fileController.openRoadBook();
    });

    // Print roadbook (Export PDF)
    document.querySelector('#print-roadbook').addEventListener('click', function(){
      _this.fileController.printRoadbook();
    });

    // Print lexicon
    document.querySelector('#print-lexicon').addEventListener('click', function(){
      _this.fileController.printLexicon();
    });

    // Save roadbook
    document.querySelector('#save-roadbook').addEventListener('click', function(e){
      e.preventDefault();
      if(_this.fileController.canSave()){
        this.classList.add('secondary');
        if(e.shiftKey){
          _this.fileController.saveRoadBookAs();
        } else {
          _this.fileController.saveRoadBook();
        }
      }
      this.blur();
    });

    // ========================================================================
    // Settings & Help Menu
    // ========================================================================

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

    // ========================================================================
    // View Menu
    // ========================================================================

    // Toggle roadbook panel
    document.querySelector('#toggle-roadbook').addEventListener('click', function(){
      _this.uiController.toggleRoadbook();
      this.blur();
    });

    // ========================================================================
    // Roadbook Name/Description Editors
    // ========================================================================

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

    // ========================================================================
    // Waypoint Palette Controls
    // ========================================================================

    // Hide waypoint palette
    document.querySelector('#hide-palette').addEventListener('click', function(){
      _this.roadbook.finishWaypointEdit();
    });

    // Toggle heading display
    document.querySelector('#toggle-heading').addEventListener('change', function(){
      var noteContainer = document.querySelector('#note-editor-container');
      var showHeading = _this.roadbook.waypointShowHeading();

      if(showHeading){
        _this.roadbook.currentlyEditingWaypoint.showHeading(false);
        noteContainer.classList.add('no-heading');
      } else {
        _this.roadbook.currentlyEditingWaypoint.showHeading(true);
        noteContainer.classList.remove('no-heading');
      }
    });

    // Open glyph selector for notes
    var glyphButtons = document.querySelectorAll('.insert-note-glyph');
    glyphButtons.forEach(function(button){
      button.addEventListener('click', function(e){
        var position = {
          top: e.clientY,
          left: e.clientX
        };
        _this.glyphControls.showGlyphModal(position.top, position.left);
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

    // ========================================================================
    // Keyboard Events
    // ========================================================================

    // Escape key exits delete modes
    document.addEventListener('keyup', function(e) {
      if(e.keyCode == 27){
        // Exit tulip edit modes
        if(_this.roadbook.currentlyEditingWaypoint){
          _this.roadbook.currentlyEditingWaypoint.tulip.finishRemove();
          _this.roadbook.currentlyEditingWaypoint.tulip.beginEdit();
        }
        // Exit marker delete mode
        if(_this.mapController.markerDeleteMode == true){
          var marker = _this.mapModel.markers[_this.mapModel.deleteQueue.pop()];
          _this.mapController.returnPointToNaturalColor(marker);
          _this.mapController.markerDeleteMode = false;
        }
      }
    });
  }
}
