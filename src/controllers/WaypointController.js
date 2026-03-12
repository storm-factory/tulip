/*
  ---------------------------------------------------------------------------
  WaypointController - Coordinates waypoint editing operations

  Responsibilities:
  - Manage waypoint editing state
  - Coordinate tulip editing (tracks, glyphs)
  - Coordinate note editing
  - Handle waypoint palette interactions
  - Manage track type selections

  Following the Service-Oriented Architecture pattern from Phase 4.
  This controller orchestrates waypoint editing workflow.
  ---------------------------------------------------------------------------
*/

function WaypointController(roadbook, uiController, eventBus) {
  this.roadbook = roadbook;
  this.uiController = uiController;
  this.eventBus = eventBus;
}

/*
  ---------------------------------------------------------------------------
  Waypoint Editing Flow
  ---------------------------------------------------------------------------
*/

/*
  Start editing a waypoint
  Opens the editing palette and sets up the UI

  Parameters:
  - waypoint: Waypoint object
*/
WaypointController.prototype.startEditingWaypoint = function(waypoint) {
  // Finish any existing edit
  this.finishEditingWaypoint();

  // Set as currently editing
  this.roadbook.currentlyEditingWaypoint = waypoint;

  // Emit event (Phase 5: EventBus)
  this.eventBus.emit(EventBus.Events.WAYPOINT_EDITING, { waypoint: waypoint });

  // Update UI
  this.uiController.showWaypointPalette();
  this.uiController.markUnsaved();

  // Populate note editor (Phase 6: vanilla JS)
  var noteEditor = document.querySelector('#note-editor');
  if (noteEditor) {
    noteEditor.innerHTML = waypoint.noteHTML();
  }

  // Populate notification controls (Phase 6: vanilla JS)
  var notificationBubble = document.querySelector('#notification-bubble');
  var notificationModifier = document.querySelector('#notification-modifier');
  if (notificationBubble) {
    notificationBubble.value = (waypoint.notification ? waypoint.notification.bubble : null);
  }
  if (notificationModifier) {
    notificationModifier.value = (waypoint.notification ? waypoint.notification.modifier : null);
  }

  // Set toggle heading checkbox (Phase 6: vanilla JS)
  var toggleHeading = document.querySelector('#toggle-heading');
  if (toggleHeading) {
    toggleHeading.checked = waypoint.showHeading();
  }

  // Update note editor container visibility (Phase 6: vanilla JS)
  var noteEditorContainer = document.querySelector('#note-editor-container');
  if (noteEditorContainer) {
    if (!waypoint.showHeading()) {
      noteEditorContainer.classList.add('hideCap');
    } else {
      noteEditorContainer.classList.remove('hideCap');
    }
  }
};

/*
  Finish editing the current waypoint
  Closes the palette and saves changes
*/
WaypointController.prototype.finishEditingWaypoint = function() {
  if (this.roadbook.currentlyEditingWaypoint) {
    var waypoint = this.roadbook.currentlyEditingWaypoint;

    // Finish tulip edit
    waypoint.tulip.finishEdit();

    // Save note HTML (Phase 6: vanilla JS)
    var noteEditor = document.querySelector('#note-editor');
    if (noteEditor) {
      waypoint.noteHTML(noteEditor.innerHTML);
    }

    // Emit event (Phase 5: EventBus)
    this.eventBus.emit(EventBus.Events.WAYPOINT_EDIT_FINISHED, { waypoint: waypoint });

    // Clear current editing reference
    this.roadbook.currentlyEditingWaypoint = null;

    // Update UI
    this.uiController.hideWaypointPalette();

    return true;
  }
  return false;
};

/*
  ---------------------------------------------------------------------------
  Track Type Management
  ---------------------------------------------------------------------------
*/

/*
  Change the track type being added to tulips

  Parameters:
  - trackType: 'offPiste', 'track', 'road', 'mainRoad', 'dcw'
*/
WaypointController.prototype.changeAddedTrackType = function(trackType) {
  if (this.roadbook.currentlyEditingWaypoint) {
    this.roadbook.currentlyEditingWaypoint.changeAddedTrackType(trackType);
  }
};

/*
  Change the entry track type for current waypoint

  Parameters:
  - trackType: 'offPiste', 'track', 'road', 'mainRoad', 'dcw'
*/
WaypointController.prototype.changeEntryTrackType = function(trackType) {
  if (this.roadbook.currentlyEditingWaypoint) {
    this.roadbook.changeEditingWaypointEntry(trackType);
  }
};

/*
  Change the exit track type for current waypoint

  Parameters:
  - trackType: 'offPiste', 'track', 'road', 'mainRoad', 'dcw'
*/
WaypointController.prototype.changeExitTrackType = function(trackType) {
  if (this.roadbook.currentlyEditingWaypoint) {
    this.roadbook.changeEditingWaypointExit(trackType);
  }
};

/*
  ---------------------------------------------------------------------------
  Tulip Editing
  ---------------------------------------------------------------------------
*/

/*
  Add a track to the current waypoint's tulip

  Parameters:
  - angle: number (0, 45, 90, 135, 180, 225, 270, 315, -45, -90, -135)
*/
WaypointController.prototype.addTrack = function(angle) {
  if (this.roadbook.currentlyEditingWaypoint) {
    this.roadbook.currentlyEditingWaypoint.tulip.addTrack(angle);
  }
};

/*
  Remove the last track from the current waypoint's tulip

  Parameters:
  - shiftKey: boolean - if true, enters remove mode
*/
WaypointController.prototype.removeTrack = function(shiftKey) {
  if (this.roadbook.currentlyEditingWaypoint) {
    if (shiftKey) {
      this.roadbook.currentlyEditingWaypoint.tulip.beginRemoveTrack();
    } else {
      this.roadbook.currentlyEditingWaypoint.tulip.removeLastTrack();
    }
  }
};

/*
  Add a glyph to the current waypoint's tulip

  Parameters:
  - top: number
  - left: number
*/
WaypointController.prototype.addGlyph = function(top, left) {
  if (this.roadbook.currentlyEditingWaypoint) {
    // This will be handled by the glyph modal
    // For now, just track the position
    app.glyphPlacementPosition = { top: top, left: left };
  }
};

/*
  ---------------------------------------------------------------------------
  Heading Management
  ---------------------------------------------------------------------------
*/

/*
  Toggle showing the heading (CAP) for current waypoint
*/
WaypointController.prototype.toggleHeading = function() {
  if (this.roadbook.currentlyEditingWaypoint) {
    // Get checkbox state (Phase 6: vanilla JS)
    var toggleHeading = document.querySelector('#toggle-heading');
    var showHeading = toggleHeading ? toggleHeading.checked : false;
    this.roadbook.currentlyEditingWaypoint.showHeading(showHeading);

    // Update note editor container (Phase 6: vanilla JS)
    var noteEditorContainer = document.querySelector('#note-editor-container');
    if (noteEditorContainer) {
      if (!showHeading) {
        noteEditorContainer.classList.add('hideCap');
      } else {
        noteEditorContainer.classList.remove('hideCap');
      }
    }
  }
};

/*
  ---------------------------------------------------------------------------
  Notification Management
  ---------------------------------------------------------------------------
*/

/*
  Update notification bubble radius

  Parameters:
  - bubble: number
*/
WaypointController.prototype.updateNotificationBubble = function(bubble) {
  if (this.roadbook.currentlyEditingWaypoint && this.roadbook.currentlyEditingWaypoint.notification) {
    this.roadbook.currentlyEditingWaypoint.notification.bubble = bubble;

    // Update map bubble if visible
    if (app.mapController) {
      app.mapController.updateWaypointBubble(
        this.roadbook.currentlyEditingWaypoint.routePointIndex,
        bubble
      );
    }
  }
};

/*
  Update notification modifier

  Parameters:
  - modifier: number
*/
WaypointController.prototype.updateNotificationModifier = function(modifier) {
  if (this.roadbook.currentlyEditingWaypoint && this.roadbook.currentlyEditingWaypoint.notification) {
    this.roadbook.currentlyEditingWaypoint.notification.modifier = modifier;
  }
};
