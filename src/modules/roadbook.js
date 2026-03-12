/*
  ============================================================================
  Roadbook Model
  ============================================================================

  Represents a complete roadbook with waypoints, notes, and metadata.

  RESPONSIBILITIES:
  - Manage collection of waypoints
  - Calculate total distance and waypoint ordering
  - Handle waypoint insertion/deletion with binary search
  - Serialize/deserialize roadbook data for saving
  - Validate roadbook data
  - Maintain roadbook metadata (name, description)

  DEPENDENCIES:
  - Knockout.js for observable data binding (required for templates)
  - Waypoint model for individual waypoint data
  - Quill.js for rich text editing of description

  COUPLING NOTES (Phase 3):
  - Uses global 'app' object for mapModel and mapController access
  - Contains some UI logic (requestWaypointEdit, resetWaypointPalette)
    TODO: Move UI logic to UIController in future refactor

  Phase 6: jQuery removed, vanilla JavaScript DOM manipulation
  Phase 3: Added validation, improved serialization, utility methods
*/
// TODO refactor to use MVC pattern and act as a model for the roadbook all UI interaction should be moved to an application controller, also change to ES6 syntax
var Roadbook = Class({
  create: function(){
    /*
      declare some state instance variables
    */
    this.currentlyEditingWaypoint = null;

    this.editingNameDesc = false;
    this.newWaypoints = false;

    /*
      declare some observable instance variables
    */
    this.name = ko.observable('Name your roadbook');
    this.desc = ko.observable('Describe your roadbook');
    this.totalDistance = ko.observable('0.00');
    this.waypoints = ko.observableArray([]);


    this.waypointShowHeading = ko.observable(true);
    /*
      Declare some internal variables
    */
    // TODO how do we handle file name changes
    this.filePath = null;
    /*
      initialize rich text editors for waypoint note instructions
      and also for the roadbook description
    */
    this.descriptionInputListener();
  },

  /*
    ---------------------------------------------------------------------------
      Waypoint management
    ---------------------------------------------------------------------------
  */

  addWaypoint: function(wptData){
    this.finishWaypointEdit();
    //determine index of waypoint based on distance from start
    var index = this.determineWaypointInsertionIndex(wptData.kmFromStart);
    /*
      if a waypoint is inserted in between two waypoints,
       check the exit track of the one before it
       and set this one's exit and entry to have the same track type
    */
    if(index > 0 && (wptData.entryTrackType == undefined)) {
      wptData.entryTrackType = this.waypoints()[index-1].exitTrackType;
      wptData.exitTrackType = wptData.entryTrackType;
    }

    //create the waypoint
    var waypoint = new Waypoint(this, wptData);

    this.waypoints.splice(index,0,waypoint);
    this.reindexWaypoints();

    //persistence tracking
    // TODO how often is this used?
    this.newWaypoints = true;
    var saveBtn = document.querySelector('#save-roadbook');
    if(saveBtn) saveBtn.classList.remove('secondary');

    return waypoint;
  },

  appendRouteFromJSON: function(json,fileName){
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.filePath = fileName
    var points = json.waypoints;
    var wpts = []
    // NOTE: For some strange reason, due to canvas rendering, a for loop causes points and waypoints to be skipped, hence for...of in
    for(point of points){
      var latLng = new google.maps.LatLng(point.lat, point.long)
      var marker = app.mapModel.addRoutePoint(latLng, app.mapController.map)
      if(point.waypoint){
        app.mapModel.setMarkerIconToWaypointIcon(marker);
        point.routePointIndex = marker.routePointIndex; //refactor to persist this
        marker.waypoint =  this.addWaypoint(point);
      }
    }
    // NOTE this is less than ideal
    if(this.desc() !== null){
      this.descriptionTextEditor.setHTML(this.desc());
    }

    var latLng = new google.maps.LatLng(points[0].lat, points[0].long);

    app.mapController.map.setCenter(latLng);
    app.mapController.map.setZoom(14);
  },

  appendGlyphToNoteTextEditor: function(image){
    var noteEditor = document.querySelector('#note-editor');
    if(noteEditor) noteEditor.appendChild(image);
  },

  changeEditingWaypointAdded: function(type){
    this.currentlyEditingWaypoint.changeAddedTrackType(type);
  },

  changeEditingWaypointEntry: function(type){
    var waypoint = this.currentlyEditingWaypoint;
    waypoint.changeEntryTrackType(type);
    var waypointIndex = this.waypoints().indexOf(waypoint)
    //if it's the first waypoint we can't change the previous waypoint exit
    // TODO loop until the track type changes
    if(waypointIndex > 0){
      this.waypoints()[waypointIndex-1].changeExitTrackType(type);
      this.waypoints()[waypointIndex-1].tulip.finishEdit();
    }
  },

  changeEditingWaypointExit: function(type){
    var waypoint = this.currentlyEditingWaypoint;
    waypoint.changeExitTrackType(type);
    var waypointIndex = this.waypoints().indexOf(waypoint)
    //if it's the last waypoint we can't change the next waypoint entry
    // TODO loop until the track type changes
    if((waypointIndex+1 < this.waypoints().length)){
      this.waypoints()[waypointIndex+1].changeEntryTrackType(type);
      this.waypoints()[waypointIndex+1].tulip.finishEdit();
    }
  },


  deleteWaypoint: function(index){
    this.finishWaypointEdit();
    this.waypoints.splice(index - 1,1);
    this.reindexWaypoints();
  },

  /*
    Use a binary search algorithm to determine the index to insert the waypoint into the roadbook
    waypoints array
  */
  determineWaypointInsertionIndex: function(kmFromStart){
    var minIndex = 0;

    var maxIndex = this.waypoints().length - 1;
    var currentIndex;
    var midpoint = this.waypoints().length/2 | 0;
    var currentWaypoint;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentWaypoint = this.waypoints()[currentIndex];

      if (currentWaypoint.kmFromStart() < kmFromStart) {
        minIndex = currentIndex + 1;
      }
      else if (currentWaypoint.kmFromStart() > kmFromStart) {
        maxIndex = currentIndex - 1;
      }
      else {
        return currentIndex;
      }
    }
    return Math.abs(~maxIndex);
  },

  /*
    This function handles' listening to input on the roadbook description
    and persisting it to the roadbook object
  */
  descriptionInputListener: function(){
    var _this = this;
    this.descriptionTextEditor = new Quill('#description-editor');
    this.descriptionTextEditor.addModule('toolbar', {
      container: '#description-toolbar'     // Selector for toolbar container
    });
    this.descriptionTextEditor.on('text-change', function(delta, source) {
      newValue = _this.descriptionTextEditor.getHTML()
      _this.desc(newValue);
    });
  },

  reindexWaypoints: function(){
    for(i = 0; i < this.waypoints().length; i++){
      waypoint = this.waypoints()[i];
      waypoint.id = i + 1; //we don't need no zero index
    }
  },

  /*
    ---------------------------------------------------------------------------
      Roadbook edit control flow
    ---------------------------------------------------------------------------
  */

  requestWaypointEdit: function(waypoint){
    if(waypoint != this.currentlyEditingWaypoint){ //we need this to discard click events fired from editing the waypoint tulip canvas
      this.finishWaypointEdit(); //clear any existing UI just to be sure
      var saveBtn = document.querySelector('#save-roadbook');
      if(saveBtn) saveBtn.classList.remove('secondary');

      this.currentlyEditingWaypoint = waypoint;

      var noteEditor = document.querySelector('#note-editor');
      if(noteEditor) noteEditor.innerHTML = waypoint.noteHTML();

      var notificationBubble = document.querySelector('#notification-bubble');
      if(notificationBubble) notificationBubble.value = (waypoint.notification ? waypoint.notification.bubble : null);

      var notificationModifier = document.querySelector('#notification-modifier');
      if(notificationModifier) notificationModifier.value = (waypoint.notification ? waypoint.notification.modifier : null);

      var noteEditorContainer = document.querySelector('#note-editor-container');
      if(noteEditorContainer){
        if(!waypoint.showHeading()){
          noteEditorContainer.classList.add('hideCap');
        } else {
          noteEditorContainer.classList.remove('hideCap');
        }
      }

      this.waypointShowHeading(waypoint.showHeading());
      // app.glyphControls.bindNoteGlyphResizable();
      app.mapController.setMapCenter({lat: waypoint.lat(), lng: waypoint.lng()});
      if(app.mapController.getMapZoom() < 18){
        app.mapController.setMapZoom(18);
      }

      var roadbookWaypoints = document.querySelector('#roadbook-waypoints');
      if(roadbookWaypoints){
        var children = roadbookWaypoints.children;
        for(var i = 0; i < children.length; i++){
          children[i].style.display = 'none';
        }
      }

      // waypoint.element is a jQuery object, get DOM element
      if(waypoint.element) {
        var waypointEl = waypoint.element[0] || waypoint.element;
        if(waypointEl && waypointEl.style) waypointEl.style.display = 'block';
      }

      var roadbook = document.querySelector('#roadbook');
      if(roadbook && waypoint.element){
        var waypointEl = waypoint.element[0] || waypoint.element;
        if(waypointEl && waypointEl.offsetTop !== undefined){
          roadbook.scrollTop = waypointEl.offsetTop - 80;
        }
      }

      var waypointPalette = document.querySelector('#waypoint-palette');
      if(waypointPalette){
        waypointPalette.style.display = 'none';
        waypointPalette.style.display = 'block';
        waypointPalette.style.animation = 'slideDown 0.5s ease-out';
      }

      if(waypoint.element){
        var waypointEl = waypoint.element[0] || waypoint.element;
        var waypointNote = waypointEl && waypointEl.querySelector ? waypointEl.querySelector('.waypoint-note') : null;
        var noteEditorContainer = document.querySelector('#note-editor-container');
        if(waypointNote && noteEditorContainer){
          waypointNote.appendChild(noteEditorContainer);
        }
      }

      if(roadbook) roadbook.style.paddingBottom = '0';

      var roadbookInfo = document.querySelectorAll('#roadbook .roadbook-info');
      roadbookInfo.forEach(function(info){ info.style.display = 'none'; });

      if(waypoint.notification){
        var notificationOptions = document.querySelector('#notification-options');
        if(notificationOptions) notificationOptions.classList.remove('hidden');
      }
      return true;
    }
  },

  finishWaypointEdit: function(){
    if(this.currentlyEditingWaypoint !== null){
      this.resetWaypointPalette(this.currentlyEditingWaypoint);
      this.updateWaypointAfterEdit(this.currentlyEditingWaypoint);
      this.currentlyEditingWaypoint = null;

      var noteEditor = document.querySelector('#note-editor');
      if(noteEditor) noteEditor.innerHTML = '';
    }
    return true;
  },

  resetWaypointPalette: function(waypoint){
    var waypointRows = document.querySelectorAll('.waypoint.row');
    waypointRows.forEach(function(row){ row.style.display = 'block'; });

    var waypointPalette = document.querySelector('#waypoint-palette');
    var noteTools = waypointPalette ? waypointPalette.querySelector('.note-tools') : null;
    var noteEditorContainer = document.querySelector('#note-editor-container');
    if(noteTools && noteEditorContainer){
      noteTools.appendChild(noteEditorContainer);
    }

    if(waypointPalette){
      waypointPalette.style.animation = 'slideUp 0.5s ease-out';
      setTimeout(function(){
        waypointPalette.style.display = 'none';
      }, 500);
    }

    var addedTrackSelectors = document.querySelectorAll('.added-track-selector');
    addedTrackSelectors.forEach(function(selector){ selector.classList.remove('active'); });
    if(addedTrackSelectors.length > 1){
      addedTrackSelectors[1].classList.add('active');
    }

    var roadbook = document.querySelector('#roadbook');
    if(roadbook) roadbook.style.paddingBottom = '150%';

    var roadbookInfo = document.querySelectorAll('#roadbook .roadbook-info');
    roadbookInfo.forEach(function(info){ info.style.display = 'block'; });

    var notificationOptions = document.querySelector('#notification-options');
    if(notificationOptions) notificationOptions.classList.add('hidden');

    if(roadbook && waypoint.element){
      var waypointEl = waypoint.element[0] || waypoint.element;
      if(waypointEl && waypointEl.offsetTop !== undefined){
        roadbook.scrollTop = waypointEl.offsetTop - 80;
      }
    }
  },

  updateWaypointAfterEdit: function(waypoint){
    waypoint.changeAddedTrackType('track');

    var noteEditor = document.querySelector('#note-editor');
    if(noteEditor) waypoint.noteHTML(noteEditor.innerHTML);

    if(waypoint.notification){
      var notificationBubble = document.querySelector('#notification-bubble');
      var notificationModifier = document.querySelector('#notification-modifier');
      if(notificationBubble) waypoint.notification.bubble = notificationBubble.value;
      if(notificationModifier) waypoint.notification.modifier = notificationModifier.value;
    }
    waypoint.tulip.finishEdit();
    waypoint.tulip.finishRemove();
  },

  updateTotalDistance: function(){
    if(this.waypoints().length > 0 ){
      this.totalDistance(this.waypoints()[this.waypoints().length - 1].totalDistance());
    } else{
      this.totalDistance(0);
    }
  },

  /*
    ---------------------------------------------------------------------------
      Roadbook persistence
    ---------------------------------------------------------------------------
  */
  // Returns a json representation of the roadbook with all geographic data and elements which capture the edited state of the roadbook.
  // This can be reloaded into app for futher editing
  statefulJSON:  function(){
    var roadbookJSON = {
      name: this.name(),
      desc: this.desc(),
      totalDistance: this.totalDistance(),
      filePath: this.filePath,
      waypoints: [],
    }
    points = app.mapModel.markers
    // TODO fold waypoint into object instead of boolean so we aren't saving nulls
    for(i = 0; i < points.length; i++){
        var waypointJSON = {
          lat: points[i].getPosition().lat(),
          long: points[i].getPosition().lng(),
          waypoint: points[i].waypoint ? true : false,
          kmFromStart: points[i].waypoint ? points[i].waypoint.kmFromStart() : null,
          kmFromPrev: points[i].waypoint ? points[i].waypoint.kmFromPrev() : null,
          heading: points[i].waypoint ? points[i].waypoint.exactHeading() : null,
          showHeading: points[i].waypoint ? points[i].waypoint.showHeading() : null,
          entryTrackType: points[i].waypoint ? points[i].waypoint.entryTrackType : null,
          exitTrackType: points[i].waypoint ? points[i].waypoint.exitTrackType : null,
          notification: points[i].waypoint && points[i].waypoint.notification  ? points[i].waypoint.notification : null,
          notes: {
            text: points[i].waypoint ? points[i].waypoint.noteHTML() : null,
          },
          tulipJson: points[i].waypoint ? points[i].waypoint.serializeTulip() : null,
        }
        roadbookJSON.waypoints.push(waypointJSON);
    }
    return roadbookJSON;
  },

  // Returns the roadbook with only neccessary information to display the roadbook
  // as the rider will see it.
  statelessJSON: function(){
    var roadbookJSON = {
      name: this.name(),
      desc: this.desc(),
      totalDistance: this.totalDistance(),
      filePath: this.filePath,
      waypoints: [],
    }
    points = app.mapModel.markers
    // TODO fold waypoint into object instead of boolean so we aren't saving nulls
    for(i = 0; i < points.length; i++){
      if(points[i].waypoint){
        var waypointJSON = {
          lat: points[i].getPosition().lat(),
          long: points[i].getPosition().lng(),
          waypoint: points[i].waypoint ? true : false,
          kmFromStart: points[i].waypoint.kmFromStart(),
          kmFromPrev: points[i].waypoint.kmFromPrev(),
          heading: points[i].waypoint.exactHeading(),
          showHeading: points[i].waypoint.showHeading(),
          notes: {
            text: points[i].waypoint.noteHTML(),
          },
          tulip: points[i].waypoint.tulipPNG(),
        }
        roadbookJSON.waypoints.push(waypointJSON);
      }

    }
    return roadbookJSON;
  },

  /*
    ---------------------------------------------------------------------------
      Phase 3: Validation and Utility Methods
    ---------------------------------------------------------------------------
  */

  /**
   * Validates roadbook data
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate: function() {
    var errors = [];

    // Validate name
    if (!this.name() || this.name().trim() === '' || this.name() === 'Name your roadbook') {
      errors.push('Roadbook must have a name');
    }

    // Validate waypoints
    if (this.waypoints().length === 0) {
      errors.push('Roadbook must have at least one waypoint');
    }

    // Validate each waypoint has valid coordinates
    for (var i = 0; i < this.waypoints().length; i++) {
      var wp = this.waypoints()[i];
      if (!this.isValidLatitude(wp.lat())) {
        errors.push('Waypoint ' + (i + 1) + ' has invalid latitude');
      }
      if (!this.isValidLongitude(wp.lng())) {
        errors.push('Waypoint ' + (i + 1) + ' has invalid longitude');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Check if roadbook has unsaved changes
   * @returns {boolean}
   */
  hasUnsavedChanges: function() {
    return this.newWaypoints || this.editingNameDesc;
  },

  /**
   * Validate latitude value
   * @param {number} lat - Latitude value
   * @returns {boolean}
   */
  isValidLatitude: function(lat) {
    return typeof lat === 'number' && lat >= -90 && lat <= 90;
  },

  /**
   * Validate longitude value
   * @param {number} lng - Longitude value
   * @returns {boolean}
   */
  isValidLongitude: function(lng) {
    return typeof lng === 'number' && lng >= -180 && lng <= 180;
  },

  /**
   * Get waypoint by index (1-based, as displayed to user)
   * @param {number} index - Waypoint number (1-based)
   * @returns {Waypoint|null}
   */
  getWaypointByNumber: function(index) {
    if (index < 1 || index > this.waypoints().length) {
      return null;
    }
    return this.waypoints()[index - 1];
  },

  /**
   * Get waypoint by route point index
   * @param {number} routePointIndex - Index in map markers array
   * @returns {Waypoint|null}
   */
  getWaypointByRouteIndex: function(routePointIndex) {
    for (var i = 0; i < this.waypoints().length; i++) {
      if (this.waypoints()[i].routePointIndex === routePointIndex) {
        return this.waypoints()[i];
      }
    }
    return null;
  },

  /**
   * Get total number of waypoints
   * @returns {number}
   */
  getWaypointCount: function() {
    return this.waypoints().length;
  },

  /**
   * Check if roadbook is empty (no waypoints)
   * @returns {boolean}
   */
  isEmpty: function() {
    return this.waypoints().length === 0;
  },

  /**
   * Clear all waypoints
   */
  clearWaypoints: function() {
    // Remove all waypoints from the observable array
    this.waypoints.removeAll();
    this.currentlyEditingWaypoint = null;
    this.updateTotalDistance();
  },

  /**
   * Get statistics about the roadbook
   * @returns {Object}
   */
  getStats: function() {
    var waypointCount = this.waypoints().length;
    var totalDist = parseFloat(this.totalDistance());
    var avgDistBetweenWaypoints = waypointCount > 1 ? totalDist / (waypointCount - 1) : 0;

    return {
      waypointCount: waypointCount,
      totalDistance: totalDist,
      averageDistanceBetweenWaypoints: avgDistBetweenWaypoints.toFixed(2),
      hasName: this.name() !== 'Name your roadbook',
      hasDescription: this.desc() !== 'Describe your roadbook' && this.desc() !== null
    };
  }

});
