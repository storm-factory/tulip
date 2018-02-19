// TODO seperate into tulip model and controller and try to abstract the instruction UI element from the data state
var Instruction = Class({
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

    // instruction don't get any note info when they are added via UI so intialize them to blank
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
    ko.bindingHandlers.instructionCanvasRendered = {
      init: function(element){
        _this.initTulip(element, angle, trackTypes, json);
        _this.initInstructionListeners($(element).parents('.waypoint'));
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

  updateInstruction: function (geoData,routePointIndex){
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

  initInstructionListeners: function(element){
    var _this = this;
    $(element).click(function(e){
      if(_this.roadbook.requestInstructionEdit(_this)){
        _this.tulip.beginEdit();
      }
    });
  },

  instructionNumber: function(){
    return this.roadbook.instructions.indexOf(this) + 1;
  },

  serializeTulip: function() {
    return this.tulip.serialize();
  },

  tulipPNG: function(){
    return this.tulip.toPNG();
  },
});
