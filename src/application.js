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
    // Create RoadbookController - coordinates roadbook file operations and exports
    this.roadbookController = new RoadbookController(
      this.roadbook,
      this.fileService,
      this.exportService,
      this.dialogService,
      this.ipcService,
      this.eventBus
    );

    // Create UIController - coordinates UI state and interactions
    this.uiController = new UIController(this.eventBus);

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

    $('#open-settings').click(function(){
      _this.settingsController.openSettings();
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
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
    this.ipcService.on('documents-path', function(event, arg){
      var path = arg+'/';
      path += _this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : _this.roadbook.name().replace(/\s/g, '-')
      _this.showSaveDialog('Save roadbook', path)
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

    this.ipcService.on('set-track-hp', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('offPiste');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[0]).addClass('active');
      }
    });

    this.ipcService.on('set-track-p', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('track');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[1]).addClass('active');
      }
    });

    this.ipcService.on('set-track-pp', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('road');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[2]).addClass('active');
      }
    });

    this.ipcService.on('set-track-ro', function(event, arg){
      if(_this.roadbook.currentlyEditingWaypoint){
        _this.roadbook.changeEditingWaypointAdded('mainRoad');
        $('.added-track-selector').removeClass('active');
        console.log($('.added-track-selector')[3]);
        $($('.added-track-selector')[3]).addClass('active');
      }
    });

    this.ipcService.on('set-track-dcw', function(event, arg){
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
