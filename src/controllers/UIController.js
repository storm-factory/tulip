/*
  ---------------------------------------------------------------------------
  UIController - Coordinates UI interactions and updates

  Responsibilities:
  - Manage UI state (roadbook panel toggle, loading indicators)
  - Coordinate UI updates in response to user actions
  - Handle UI-related button clicks and interactions
  - Manage visual feedback and transitions

  Following the Service-Oriented Architecture pattern from Phase 4.
  This controller handles UI coordination without business logic.
  ---------------------------------------------------------------------------
*/

function UIController(eventBus) {
  this.eventBus = eventBus;
  this.isRoadbookExpanded = false;

  // Set up event listeners (Phase 5: EventBus)
  this.setupEventListeners();
}

/*
  Set up event listeners for UI updates
*/
UIController.prototype.setupEventListeners = function() {
  var _this = this;

  // Listen for roadbook loaded - enable export buttons
  this.eventBus.on(EventBus.Events.ROADBOOK_LOADED, function(data) {
    _this.enableExportButtons();
  });

  // Listen for roadbook saved - update save button state
  this.eventBus.on(EventBus.Events.ROADBOOK_SAVED, function(data) {
    _this.markSaved();
  });

  // Listen for export events to show/hide loading
  this.eventBus.on(EventBus.Events.EXPORT_STARTED, function(data) {
    console.log('Export started:', data.type);
  });

  this.eventBus.on(EventBus.Events.EXPORT_COMPLETED, function(data) {
    console.log('Export completed:', data.type, data.outputPath);
  });
};

/*
  ---------------------------------------------------------------------------
  Roadbook Panel Management
  ---------------------------------------------------------------------------
*/

/*
  Toggle the roadbook panel (collapsed/expanded)
*/
UIController.prototype.toggleRoadbook = function() {
  $('.roadbook-container').toggleClass('collapsed');
  $('.roadbook-container').toggleClass('expanded');

  $('#toggle-roadbook i').toggleClass('fi-arrow-down');
  $('#toggle-roadbook i').toggleClass('fi-arrow-up');

  this.isRoadbookExpanded = !this.isRoadbookExpanded;
};

/*
  Expand the roadbook panel
*/
UIController.prototype.expandRoadbook = function() {
  if (!this.isRoadbookExpanded) {
    this.toggleRoadbook();
  }
};

/*
  Collapse the roadbook panel
*/
UIController.prototype.collapseRoadbook = function() {
  if (this.isRoadbookExpanded) {
    this.toggleRoadbook();
  }
};

/*
  ---------------------------------------------------------------------------
  Loading Indicators
  ---------------------------------------------------------------------------
*/

/*
  Show loading indicator
*/
UIController.prototype.showLoading = function() {
  $('#loading').show();
};

/*
  Hide loading indicator
*/
UIController.prototype.hideLoading = function() {
  $('#loading').hide();
};

/*
  ---------------------------------------------------------------------------
  Menu Management
  ---------------------------------------------------------------------------
*/

/*
  Close the off-canvas menu
*/
UIController.prototype.closeMenu = function() {
  $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
};

/*
  Open the off-canvas menu
*/
UIController.prototype.openMenu = function() {
  $('.off-canvas-wrap').foundation('offcanvas', 'show', 'move-left');
};

/*
  ---------------------------------------------------------------------------
  Button State Management
  ---------------------------------------------------------------------------
*/

/*
  Enable export buttons (GPX, PDF)
*/
UIController.prototype.enableExportButtons = function() {
  $('#print-roadbook').removeClass('disabled');
  $('#export-gpx').removeClass('disabled');
  $('#export-openrally-gpx').removeClass('disabled');
};

/*
  Disable export buttons (GPX, PDF)
*/
UIController.prototype.disableExportButtons = function() {
  $('#print-roadbook').addClass('disabled');
  $('#export-gpx').addClass('disabled');
  $('#export-openrally-gpx').addClass('disabled');
};

/*
  Mark save button as having unsaved changes
*/
UIController.prototype.markUnsaved = function() {
  $('#save-roadbook').removeClass('secondary');
};

/*
  Mark save button as saved
*/
UIController.prototype.markSaved = function() {
  $('#save-roadbook').addClass('secondary');
};

/*
  ---------------------------------------------------------------------------
  Scroll and Navigation
  ---------------------------------------------------------------------------
*/

/*
  Scroll roadbook to show a specific waypoint

  Parameters:
  - waypointElement: jQuery element or DOM element
*/
UIController.prototype.scrollToWaypoint = function(waypointElement) {
  var $element = $(waypointElement);
  $('#roadbook').scrollTop(0);
  $('#roadbook').scrollTop(($element.offset().top - 100));
};

/*
  ---------------------------------------------------------------------------
  Waypoint Editor Management
  ---------------------------------------------------------------------------
*/

/*
  Show the waypoint editing palette
*/
UIController.prototype.showWaypointPalette = function() {
  $('#waypoint-palette').show();
};

/*
  Hide the waypoint editing palette
*/
UIController.prototype.hideWaypointPalette = function() {
  $('#waypoint-palette').hide();
};

/*
  ---------------------------------------------------------------------------
  Name/Description Editor Management
  ---------------------------------------------------------------------------
*/

/*
  Show the name/description editor

  Parameters:
  - type: 'name' or 'desc'
*/
UIController.prototype.showNameDescEditor = function(type) {
  var selector = type === 'name' ? '#roadbook-name' : '#roadbook-desc';

  $(selector).find('.show-editor').hide();
  $(selector).find('.hide-editor').show();
  $(selector).find('.roadbook-header-input-container').slideDown('fast');

  if (type === 'name') {
    $(selector).find(':input').focus();
  } else if (type === 'desc') {
    $('#roadbook-desc p').slideUp('fast');
    app.roadbook.descriptionTextEditor.focus();
  }

  this.markUnsaved();
};

/*
  Hide the name/description editor

  Parameters:
  - type: 'name' or 'desc'
*/
UIController.prototype.hideNameDescEditor = function(type) {
  var selector = type === 'name' ? '#roadbook-name' : '#roadbook-desc';

  $(selector).find('.hide-editor').hide();
  $(selector).find('.show-editor').show();
  $(selector).find('.roadbook-header-input-container').slideUp('fast');

  if (type === 'desc') {
    $('#roadbook-desc p').slideDown('fast');
  }
};

/*
  ---------------------------------------------------------------------------
  Notification Options
  ---------------------------------------------------------------------------
*/

/*
  Show notification options panel
*/
UIController.prototype.showNotificationOptions = function() {
  $('#notification-options').removeClass('hidden');
};

/*
  Hide notification options panel
*/
UIController.prototype.hideNotificationOptions = function() {
  $('#notification-options').addClass('hidden');
};
