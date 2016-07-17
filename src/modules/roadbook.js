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

    /*
      Declare some internal variables
    */
    // TODO how do we handle file name changes
    this.filePath = null;
    /*
      initialize rich text editors for waypoint note instructions
      and also for the roadbook description
    */
    this.waypointNoteInputListener();
    this.descriptionInputListener();
  },

  /*
    ---------------------------------------------------------------------------
      Waypoint management
    ---------------------------------------------------------------------------
  */

  addWaypoint: function(wptData){

    //determine index of waypoint based on distance from start
    var index = this.determineWaypointInsertionIndex(wptData.distances.kmFromStart);
    /*
      if a waypoint is inserted in between two waypoints,
       check the exit track of the one before it
       and set this one's exit and entry to have the same track type
    */
    if(index > 0) {
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
    $('#save-roadbook').removeClass('secondary');

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
      var routePoint = app.mapEditor.addRoutePoint(latLng, null, true); //this returns a point
      if(point.waypoint){
        var opts = app.mapEditor.addWaypoint(routePoint); //this returns distance opts but if we already have that saved then why do we care?
        opts.tulipJson = point.tulipJson;
        opts.angles.heading = point.heading;

        // NOTE: this is just to avoid breaking changes for v1.2b, it should come out in the next release
        for(i=0;i<point.notes.glyphs.length;i++){
          point.notes.glyphs[i].src = app.fixGlyphPaths(point.notes.glyphs[i].src);
        }

        opts.notes = point.notes;
        routePoint.waypoint =  this.addWaypoint(opts);
      }
    }
    // NOTE this is less than ideal
    if(this.desc() !== null){
      this.descriptionTextEditor.setHTML(this.desc());
    }
    // TODO this also needs to be abstracted to the app object
    app.mapEditor.updateRoute();
    var latLng = new google.maps.LatLng(points[0].lat, points[0].long);
    app.mapEditor.map.setCenter(latLng);
  },

  changeEditingWaypointAdded: function(type){
    console.log('added: ' + type);
    this.currentlyEditingWaypoint.changeAddedTrackType(type);
  },

  changeEditingWaypointEntry: function(type){
    console.log('entry: ' + type);
    var waypoint = this.currentlyEditingWaypoint;
    waypoint.changeEntryTrackType(type);
    var waypointIndex = this.waypoints().indexOf(waypoint)
    //if it's the first waypoint we can't change the previous waypoint exit
    if(waypointIndex > 0){
      this.waypoints()[waypointIndex-1].changeExitTrackType(type);
    }
  },

  changeEditingWaypointExit: function(type){
    console.log('exit: ' + type);
    var waypoint = this.currentlyEditingWaypoint;
    waypoint.changeExitTrackType(type);
    var waypointIndex = this.waypoints().indexOf(waypoint)
    //if it's the last waypoint we can't change the next waypoint entry
    console.log((waypointIndex+1 < this.waypoints().length));
    if((waypointIndex+1 < this.waypoints().length)){
      this.waypoints()[waypointIndex+1].changeEntryTrackType(type);
    }
  },

  deleteWaypoint: function(wptId){
    this.waypoints.splice(wptId - 1,1);
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
    var currentElement;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = this.waypoints()[currentIndex];

      if (currentElement.kmFromStart() < kmFromStart) {
        minIndex = currentIndex + 1;
      }
      else if (currentElement.kmFromStart() > kmFromStart) {
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

  /*
    This function handles' listening to input on the waypoint palette
    and persisting it to the waypoint object
  */
  waypointNoteInputListener: function(){
    var _this = this;
    this.noteTextEditor = new Quill('#note-editor');
    this.noteTextEditor.addModule('toolbar', {
      container: '#note-toolbar'     // Selector for toolbar container
    });
    this.noteTextEditor.on('text-change', function(delta, source) {
      newValue = _this.noteTextEditor.getHTML()
      if(_this.currentlyEditingWaypoint !== null) {
        _this.currentlyEditingWaypoint.noteHTML(newValue);
      }
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
      this.currentlyEditingWaypoint = waypoint;
      this.noteTextEditor.setHTML(waypoint.noteHTML());
      return true;
    }
  },

  finishWaypointEdit: function(){
    if(this.currentlyEditingWaypoint !== null){
      $('#roadbook').scrollTop(this.currentlyEditingWaypoint.element.position().top - 80)
      this.currentlyEditingWaypoint.tulip.finishEdit();
      this.currentlyEditingWaypoint = null;
      this.noteTextEditor.setHTML('');
    }
    return true;
  },

  finishNameDescEdit: function(){
    if(this.editingNameDesc == true){
      this.editingNameDesc = false;
      $('#roadbook-desc, #roadbook-name').find('a').show('fast')
      $('#roadbook-desc, #roadbook-name').find(':input').hide('fast');
      return true;
    }
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
    points = app.mapEditor.routeMarkers
    // TODO fold waypoint into object instead of boolean so we aren't saving nulls
    for(i = 0; i < points.length; i++){
        var waypointJSON = {
          lat: points[i].getPosition().lat(),
          long: points[i].getPosition().lng(),
          waypoint: points[i].waypoint ? true : false,
          kmFromStart: points[i].waypoint ? points[i].waypoint.kmFromStart() : null,
          kmFromPrev: points[i].waypoint ? points[i].waypoint.kmFromPrev() : null,
          heading: points[i].waypoint ? points[i].waypoint.exactHeading() : null,
          entryTrackType: points[i].waypoint ? points[i].waypoint.entryTrackType : null,
          exitTrackType: points[i].waypoint ? points[i].waypoint.exitTrackType : null,
          notes: {
            text: points[i].waypoint ? points[i].waypoint.noteHTML() : null,
            glyphs: points[i].waypoint ? points[i].waypoint.noteGlyphs() : null,
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
    points = app.mapEditor.routeMarkers
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
          notes: {
            text: points[i].waypoint.noteHTML(),
            glyphs: points[i].waypoint.noteGlyphs(), //TODO need to convert paths into actual file contents
          },
          tulip: points[i].waypoint.tulipPNG(),
        }
        roadbookJSON.waypoints.push(waypointJSON);
      }

    }
    return roadbookJSON;
  },

});
