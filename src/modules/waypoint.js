/*
  ============================================================================
  Waypoint Model
  ============================================================================

  Represents a single waypoint in a roadbook with position, heading, notes,
  and associated tulip diagram.

  RESPONSIBILITIES:
  - Store waypoint position (lat/lng) and navigation data
  - Calculate distances, headings, and bearings
  - Manage waypoint notes and notifications
  - Manage tulip diagram (visual turn representation)
  - Handle track type configuration (entry/exit/added)
  - Validate waypoint data

  DEPENDENCIES:
  - Knockout.js for observable data binding (required for templates)
  - Tulip model for turn diagram rendering
  - Notification model for rally notifications (WPM, WPS, DSZ)

  COUPLING NOTES (Phase 3):
  - Uses global 'app' object for mapController access
  - Contains Knockout binding handler for canvas rendering
    (Required for current template structure)

  Phase 6: jQuery removed, vanilla JavaScript event listeners
  Phase 3: Added validation, distance/bearing calculations, toJSON
*/
// TODO seperate into tulip model and controller and try to abstract the waypoint UI element from the data state
var Waypoint = Class({
  /*

    wptJson: {
            distances: {
              kmFromStart: FLOAT,
              kmFromPrev: FLOAT,
            },
            angles: {
              heading: INTEGER,
              relativeAngle: INTEGER.
            },
            tulipJson: OBJECT,
            notes: {
              glyphs:[],
              text: STRING,
            },
    }
  */
  create: function(roadbook, wptJson){
    // can all this knockout stuff be at the controller level then model data is updated when controller starts up or shuts down
    this.kmFromStart    = ko.observable(wptJson.kmFromStart);
    this.kmFromPrev     = ko.observable(wptJson.kmFromPrev);
    this.exactHeading   = ko.observable(wptJson.heading);
    this.lat            = ko.observable(wptJson.lat);
    this.lng            = ko.observable(wptJson.long);

    this.distFromPrev   = ko.computed(this.computedDistanceFromPrev, this);
    this.totalDistance  = ko.computed(this.computedTotalDistance, this);
    this.heading        = ko.computed(this.computedHeading, this);

    this.showHeading    = ko.observable((wptJson.showHeading == undefined ? true : wptJson.showHeading));
    this.entryTrackType = wptJson.entryTrackType == undefined ? 'track' : wptJson.entryTrackType;
    this.exitTrackType  = wptJson.exitTrackType == undefined ? 'track' : wptJson.exitTrackType;

    // waypoints don't get any note info when they are added via UI so intialize them to blank
    var text = wptJson.notes == undefined ? '' : wptJson.notes.text;
    this.noteHTML = ko.observable(text);

    this.roadbook = roadbook;
    this.routePointIndex = wptJson.routePointIndex == undefined ? null : wptJson.routePointIndex;
    // TODO refactor to make this one line
    this.notification = wptJson.notification;
    if(this.notification){
      app.mapController.addWaypointBubble(this.routePointIndex, this.notification.bubble, this.notification.fill)
    }


    var _this = this;
    var angle = wptJson.relativeAngle;
    var json = wptJson.tulipJson;
    var trackTypes = {entryTrackType: this.entryTrackType, exitTrackType: this.exitTrackType};
    ko.bindingHandlers.waypointCanvasRendered = {
      init: function(element){
        _this.initTulip(element, angle, trackTypes, json);
        _this.initWaypointListeners($(element).parents('.waypoint'));
        _this.element = $(element).parents('.waypoint');
      }
    };
  },
  //TODO This needs refactored
  manageNotifications(glyphs){
    if(this.notification == null){
      // create a new notification
      for(i=0;i<glyphs.length;i++){
        // grab the glyph name from the file name, agnostic to the path.
        this.notification = new Notification(glyphs[i]);
        if(this.notification.type == null){
          this.notification = null
        }else {
          app.mapController.addWaypointBubble(this.routePointIndex, this.notification.bubble, this.notification.fill)
          // show notification options
          $('#notification-options').removeClass('hidden');
          app.noteControls.updateNotificationControls(this.notification);
        }

      }
    }else{
      // see if we need to set a speed zone limit
      if(this.notification.type == "dsz"){
        var speed = glyphs.join(' ').match(/speed-([0-9]{2,3})/)[1]
        this.notification.modifier = speed;
      }
      // see if we need to remove the notification using the notification class
      var _this = this;
      var contains = glyphs.map(function(g){return Notification.nameMatchesClass(g,_this.notification.type)});
      // if the glyphs array contains our notification keep it and update the bubble

      if(contains.includes(true)){
        app.mapController.updateWaypointBubble(this.routePointIndex,this.notification.bubble);
      }else{ //otherwise nullify our current notification
        this.notification = null;
        $('#notification-options').addClass('hidden');
        app.mapController.deleteWaypointBubble(this.routePointIndex);
      }
    }
  },

  hasNotification(){
    return this.notification != null;
  },

  changeAddedTrackType(type){
    this.tulip.changeAddedTrackType(type)
  },

  changeEntryTrackType(type){
    this.entryTrackType = type;
    this.tulip.changeEntryTrackType(type)
  },

  changeExitTrackType(type){
    this.exitTrackType = type;
    this.tulip.changeExitTrackType(type)
  },

  // definitelty needs to be put at controller level
  initTulip: function(element, angle, trackTypes, json){
    this.tulip = new Tulip(element, angle, trackTypes, json);
  },

  updateWaypoint: function (geoData,routePointIndex){
    if(geoData.kmFromStart){
      this.kmFromStart(geoData.kmFromStart);
    }
    if(geoData.kmFromPrev){
      this.kmFromPrev(geoData.kmFromPrev);
    }
    if(geoData.heading){
      this.exactHeading(geoData.heading);
    }
    if(geoData.relativeAngle){
      this.tulip.changeExitAngle(geoData.relativeAngle, this.exitTrackType);
    }
    if(geoData.lat && geoData.long){
      this.lat(geoData.lat);
      this.lng(geoData.long);
    }
    if(routePointIndex) {
      this.routePointIndex = routePointIndex
    }
  },

  computedDistanceFromPrev: function(){
    if(this.kmFromPrev() && this.kmFromPrev() > 0){
      return this.kmFromPrev().toFixed(2);
    } else {
      return '0.00'
    }
  },

  computedTotalDistance: function(){
    return this.kmFromStart().toFixed(2);
  },

  computedHeading: function(){
    var heading = Math.round(this.exactHeading());
    //round the exaxt heading and zero pad it
    return Array(Math.max(3 - String(heading).length + 1, 0)).join(0) + heading + '\xB0';
  },

  initWaypointListeners: function(element){
    var _this = this;
    $(element).click(function(e){
      if(_this.roadbook.requestWaypointEdit(_this)){
        _this.tulip.beginEdit();
      }
    });
  },

  serializeTulip: function() {
    return this.tulip.serialize();
  },

  tulipPNG: function(){
    return this.tulip.toPNG();
  },

  /*
    ---------------------------------------------------------------------------
      Phase 3: Validation and Utility Methods
    ---------------------------------------------------------------------------
  */

  /**
   * Validates waypoint data
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate: function() {
    var errors = [];

    // Validate coordinates
    if (!this.isValidLatitude(this.lat())) {
      errors.push('Invalid latitude: ' + this.lat());
    }
    if (!this.isValidLongitude(this.lng())) {
      errors.push('Invalid longitude: ' + this.lng());
    }

    // Validate distances
    if (this.kmFromStart() < 0) {
      errors.push('Distance from start cannot be negative');
    }
    if (this.kmFromPrev() < 0) {
      errors.push('Distance from previous cannot be negative');
    }

    // Validate heading
    if (this.exactHeading() < 0 || this.exactHeading() >= 360) {
      errors.push('Heading must be between 0 and 359 degrees');
    }

    // Validate track types
    var validTypes = ['track', 'road', 'mainRoad', 'offPiste', 'dcw'];
    if (validTypes.indexOf(this.entryTrackType) === -1) {
      errors.push('Invalid entry track type: ' + this.entryTrackType);
    }
    if (validTypes.indexOf(this.exitTrackType) === -1) {
      errors.push('Invalid exit track type: ' + this.exitTrackType);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
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
   * Get position as LatLng object
   * @returns {Object} { lat: number, lng: number }
   */
  getPosition: function() {
    return {
      lat: this.lat(),
      lng: this.lng()
    };
  },

  /**
   * Set position from LatLng object
   * @param {Object} position - { lat: number, lng: number }
   */
  setPosition: function(position) {
    if (position.lat !== undefined) this.lat(position.lat);
    if (position.lng !== undefined) this.lng(position.lng);
  },

  /**
   * Check if waypoint has a note
   * @returns {boolean}
   */
  hasNote: function() {
    return this.noteHTML() && this.noteHTML().trim() !== '';
  },

  /**
   * Check if waypoint has a notification
   * @returns {boolean}
   */
  hasNotification: function(){
    return this.notification != null;
  },

  /**
   * Calculate distance to another waypoint using Haversine formula
   * @param {Waypoint} otherWaypoint
   * @returns {number} Distance in kilometers
   */
  distanceTo: function(otherWaypoint) {
    var R = 6371; // Earth radius in km
    var dLat = this.toRad(otherWaypoint.lat() - this.lat());
    var dLon = this.toRad(otherWaypoint.lng() - this.lng());

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(this.lat())) * Math.cos(this.toRad(otherWaypoint.lat())) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @returns {number}
   */
  toRad: function(degrees) {
    return degrees * Math.PI / 180;
  },

  /**
   * Calculate bearing to another waypoint
   * @param {Waypoint} otherWaypoint
   * @returns {number} Bearing in degrees (0-359)
   */
  bearingTo: function(otherWaypoint) {
    var dLon = this.toRad(otherWaypoint.lng() - this.lng());
    var lat1 = this.toRad(this.lat());
    var lat2 = this.toRad(otherWaypoint.lat());

    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    var bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  },

  /**
   * Get waypoint as JSON for export
   * @returns {Object}
   */
  toJSON: function() {
    return {
      lat: this.lat(),
      long: this.lng(),
      kmFromStart: this.kmFromStart(),
      kmFromPrev: this.kmFromPrev(),
      heading: this.exactHeading(),
      showHeading: this.showHeading(),
      entryTrackType: this.entryTrackType,
      exitTrackType: this.exitTrackType,
      notification: this.notification,
      notes: {
        text: this.noteHTML()
      },
      tulipJson: this.tulip ? this.serializeTulip() : null,
      routePointIndex: this.routePointIndex
    };
  }
});
