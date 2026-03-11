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

  Phase 6: Converted from jQuery to vanilla JavaScript
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
  var container = document.querySelector('.roadbook-container');
  container.classList.toggle('collapsed');
  container.classList.toggle('expanded');

  var icon = document.querySelector('#toggle-roadbook i');
  icon.classList.toggle('fi-arrow-down');
  icon.classList.toggle('fi-arrow-up');

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
  var loading = document.querySelector('#loading');
  if (loading) {
    loading.style.display = 'block';
  }
};

/*
  Hide loading indicator
*/
UIController.prototype.hideLoading = function() {
  var loading = document.querySelector('#loading');
  if (loading) {
    loading.style.display = 'none';
  }
};

/*
  ---------------------------------------------------------------------------
  Menu Management
  ---------------------------------------------------------------------------
*/

/*
  Close the off-canvas menu
  Note: Still uses Foundation until Phase 7 (Modernize CSS)
*/
UIController.prototype.closeMenu = function() {
  $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
};

/*
  Open the off-canvas menu
  Note: Still uses Foundation until Phase 7 (Modernize CSS)
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
  document.querySelector('#print-roadbook').classList.remove('disabled');
  document.querySelector('#export-gpx').classList.remove('disabled');
  document.querySelector('#export-openrally-gpx').classList.remove('disabled');
};

/*
  Disable export buttons (GPX, PDF)
*/
UIController.prototype.disableExportButtons = function() {
  document.querySelector('#print-roadbook').classList.add('disabled');
  document.querySelector('#export-gpx').classList.add('disabled');
  document.querySelector('#export-openrally-gpx').classList.add('disabled');
};

/*
  Mark save button as having unsaved changes
*/
UIController.prototype.markUnsaved = function() {
  document.querySelector('#save-roadbook').classList.remove('secondary');
};

/*
  Mark save button as saved
*/
UIController.prototype.markSaved = function() {
  document.querySelector('#save-roadbook').classList.add('secondary');
};

/*
  ---------------------------------------------------------------------------
  Scroll and Navigation
  ---------------------------------------------------------------------------
*/

/*
  Scroll roadbook to show a specific waypoint

  Parameters:
  - waypointElement: DOM element or jQuery element (for backwards compatibility)
*/
UIController.prototype.scrollToWaypoint = function(waypointElement) {
  // Handle both DOM elements and jQuery objects
  var element = waypointElement.jquery ? waypointElement[0] : waypointElement;

  var roadbook = document.querySelector('#roadbook');
  roadbook.scrollTop = 0;

  // Get element position relative to document
  var elementTop = element.getBoundingClientRect().top + roadbook.scrollTop;
  roadbook.scrollTop = elementTop - 100;
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
  var palette = document.querySelector('#waypoint-palette');
  if (palette) {
    palette.style.display = 'block';
  }
};

/*
  Hide the waypoint editing palette
*/
UIController.prototype.hideWaypointPalette = function() {
  var palette = document.querySelector('#waypoint-palette');
  if (palette) {
    palette.style.display = 'none';
  }
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
  var container = document.querySelector(selector);

  var showEditor = container.querySelector('.show-editor');
  var hideEditor = container.querySelector('.hide-editor');
  var inputContainer = container.querySelector('.roadbook-header-input-container');

  if (showEditor) showEditor.style.display = 'none';
  if (hideEditor) hideEditor.style.display = 'block';
  if (inputContainer) inputContainer.style.display = 'block';

  if (type === 'name') {
    var input = container.querySelector('input');
    if (input) input.focus();
  } else if (type === 'desc') {
    var descP = document.querySelector('#roadbook-desc p');
    if (descP) descP.style.display = 'none';
    if (app.roadbook.descriptionTextEditor) {
      app.roadbook.descriptionTextEditor.focus();
    }
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
  var container = document.querySelector(selector);

  var hideEditor = container.querySelector('.hide-editor');
  var showEditor = container.querySelector('.show-editor');
  var inputContainer = container.querySelector('.roadbook-header-input-container');

  if (hideEditor) hideEditor.style.display = 'none';
  if (showEditor) showEditor.style.display = 'block';
  if (inputContainer) inputContainer.style.display = 'none';

  if (type === 'desc') {
    var descP = document.querySelector('#roadbook-desc p');
    if (descP) descP.style.display = 'block';
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
  var options = document.querySelector('#notification-options');
  if (options) {
    options.classList.remove('hidden');
  }
};

/*
  Hide notification options panel
*/
UIController.prototype.hideNotificationOptions = function() {
  var options = document.querySelector('#notification-options');
  if (options) {
    options.classList.add('hidden');
  }
};
