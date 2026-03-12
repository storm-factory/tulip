/*
  ---------------------------------------------------------------------------
  EventBus - Decoupled component communication

  Responsibilities:
  - Manage event subscriptions (on, off, once)
  - Emit events to all subscribers
  - Provide error isolation (one handler failure doesn't break others)
  - Enable decoupled communication between components

  Following the Service-Oriented Architecture pattern from Phase 5.
  This enables loose coupling between Controllers, Services, and UI.
  ---------------------------------------------------------------------------
*/

function EventBus() {
  this.listeners = new Map();
}

/*
  Subscribe to an event

  Parameters:
  - event: string - Event name (e.g., 'roadbook:loaded')
  - callback: function(data) - Handler function
*/
EventBus.prototype.on = function(event, callback) {
  if (!this.listeners.has(event)) {
    this.listeners.set(event, []);
  }
  this.listeners.get(event).push(callback);
};

/*
  Emit an event to all subscribers

  Parameters:
  - event: string - Event name
  - data: any - Data to pass to handlers (optional)
*/
EventBus.prototype.emit = function(event, data) {
  var callbacks = this.listeners.get(event) || [];
  callbacks.forEach(function(cb) {
    try {
      cb(data);
    } catch (error) {
      console.error('Error in event handler for ' + event + ':', error);
    }
  });
};

/*
  Unsubscribe from an event

  Parameters:
  - event: string - Event name
  - callback: function - The specific handler to remove
*/
EventBus.prototype.off = function(event, callback) {
  var callbacks = this.listeners.get(event) || [];
  var index = callbacks.indexOf(callback);
  if (index > -1) {
    callbacks.splice(index, 1);
  }
};

/*
  Subscribe to an event, but only fire once

  Parameters:
  - event: string - Event name
  - callback: function(data) - Handler function (auto-unsubscribes after first call)
*/
EventBus.prototype.once = function(event, callback) {
  var _this = this;
  var wrapper = function(data) {
    callback(data);
    _this.off(event, wrapper);
  };
  this.on(event, wrapper);
};

/*
  Clear all event listeners
*/
EventBus.prototype.clear = function() {
  this.listeners.clear();
};

/*
  Get count of listeners for an event (for debugging)

  Parameters:
  - event: string - Event name

  Returns: number - Count of registered listeners
*/
EventBus.prototype.listenerCount = function(event) {
  var callbacks = this.listeners.get(event) || [];
  return callbacks.length;
};

/*
  ---------------------------------------------------------------------------
  Standard Event Names

  Use these constants to avoid typos and enable IDE autocomplete
  ---------------------------------------------------------------------------
*/

EventBus.Events = {
  // Roadbook events
  ROADBOOK_LOADED: 'roadbook:loaded',
  ROADBOOK_SAVED: 'roadbook:saved',
  ROADBOOK_MODIFIED: 'roadbook:modified',
  ROADBOOK_CLEARED: 'roadbook:cleared',

  // Waypoint events
  WAYPOINT_ADDED: 'waypoint:added',
  WAYPOINT_REMOVED: 'waypoint:removed',
  WAYPOINT_EDITING: 'waypoint:editing',
  WAYPOINT_EDIT_FINISHED: 'waypoint:editFinished',
  WAYPOINT_MODIFIED: 'waypoint:modified',
  WAYPOINT_CLICKED: 'waypoint:clicked',

  // Map events
  MAP_CLICKED: 'map:clicked',
  MAP_LOADED: 'map:loaded',

  // Export events
  EXPORT_STARTED: 'export:started',
  EXPORT_COMPLETED: 'export:completed',
  EXPORT_FAILED: 'export:failed',

  // Import events
  IMPORT_STARTED: 'import:started',
  IMPORT_COMPLETED: 'import:completed',
  IMPORT_FAILED: 'import:failed',

  // UI events
  UI_LOADING_STARTED: 'ui:loadingStarted',
  UI_LOADING_STOPPED: 'ui:loadingStopped',

  // Error events
  ERROR_OCCURRED: 'error:occurred'
};
