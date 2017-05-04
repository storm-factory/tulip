'use strict';
// TODO refactor this to use MVC pattern and act as a model for the roadbook all UI interaction should be moved to an application controller, also change to ES6 syntax
// TODO rename instructions to instructions
class RoadbookModel{
  constructor(){
    /*
      declare some state instance variables
    */
    this.currentlyEditingWaypoint = null;
    this.editingNameDesc = false;
    this.newWaypoints = false;

    /*
      Declare some internal variables
    */
    // TODO how do we handle file name changes
    this.filePath = null;

  }

  /*
    ---------------------------------------------------------------------------
      Waypoint management
    ---------------------------------------------------------------------------
  */

  addWaypoint(instructionData){
    this.finishWaypointEdit(); //TODO make callback?

    var index = this.determineInstructionInsertionIndex(instructionData.kmFromStart);
    this.determineInstructionTrackTypes(index,instructionData);

    //create the instruction
    var instruction = new Waypoint(this, instructionData);

    this.instructions.splice(index,0,instruction);
    this.reindexWaypoints();

    //persistence tracking
    // TODO how often is this used?
    this.newWaypoints = true;
    $('#save-roadbook').removeClass('secondary'); //TODO this shouldn't be here

    return instruction;
  }

  appendRouteFromJSON(json,fileName){
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.filePath = fileName
    var points = json.instructions;
    var wpts = []
    // NOTE: For some strange reason, due to canvas rendering, a for loop causes points and instructions to be skipped, hence for...of in
    for(var point of points){
      var latLng = new google.maps.LatLng(point.lat, point.long)
      var marker = app.mapModel.addRoutePoint(latLng, app.mapController.map)
      if(point.instruction){
        app.mapModel.setMarkerIconToWaypointIcon(marker);
        point.routePointIndex = marker.routePointIndex; //refactor to persist this
        marker.instruction =  this.appendWaypoint(point);
      }
    }
    // NOTE this is less than ideal
    if(this.desc() !== null){
      this.controller.descriptionTextEditor.setHTML(this.desc());
    }
    app.mapModel.updateAllMarkersWaypointGeoData();
    var latLng = new google.maps.LatLng(points[0].lat, points[0].long);

    app.mapController.map.setCenter(latLng);
    app.mapController.map.setZoom(14);
  }

  appendGlyphToNoteTextEditor(image){
    $('#note-editor').append(image);
  }

  appendWaypoint(wptData){
    var instruction = new Waypoint(this, wptData);
    this.instructions.push(instruction);
    return instruction;
  }

  bindToKnockout(){
    /*
      declare some observable instance variables
    */
    this.name = ko.observable('Name your roadbook');
    this.desc = ko.observable('Describe your roadbook');
    this.totalDistance = ko.observable('0.00');
    this.instructions = ko.observableArray([]);
    this.instructionShowHeading = ko.observable(true);
  }

  changeEditingWaypointAdded(type){
    this.currentlyEditingWaypoint.changeAddedTrackType(type);
  }

  changeEditingWaypointEntry(type){
    var instruction = this.currentlyEditingWaypoint;
    instruction.changeEntryTrackType(type);
    var instructionIndex = this.instructions().indexOf(instruction)
    //if it's the first instruction we can't change the previous instruction exit
    // TODO loop until the track type changes
    if(instructionIndex > 0){
      this.instructions()[instructionIndex-1].changeExitTrackType(type);
      this.instructions()[instructionIndex-1].tulip.finishEdit();
    }
  }

  changeEditingWaypointExit(type){
    var instruction = this.currentlyEditingWaypoint;
    instruction.changeExitTrackType(type);
    var instructionIndex = this.instructions().indexOf(instruction)
    //if it's the last instruction we can't change the next instruction entry
    // TODO loop until the track type changes
    if((instructionIndex+1 < this.instructions().length)){
      this.instructions()[instructionIndex+1].changeEntryTrackType(type);
      this.instructions()[instructionIndex+1].tulip.finishEdit();
    }
  }


  deleteWaypoint(index){
    this.finishWaypointEdit();
    this.instructions.splice(index - 1,1);
    this.reindexWaypoints();
  }

  /*
    Use a binary search algorithm to determine the index to insert the instruction into the roadbook
    instructions array based on the distance from the start
  */
  determineInstructionInsertionIndex(kmFromStart){
    var minIndex = 0;

    var maxIndex = this.instructions().length - 1;
    var currentIndex;
    var midpoint = this.instructions().length/2 | 0;
    var currentWaypoint;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentWaypoint = this.instructions()[currentIndex];

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
  }

  /*
    if a instruction is inserted in between two instructions,
     check the exit track of the one before it
     and set this one's exit and entry to have the same track type
  */
  determineInstructionTrackTypes(index,instructionData){
    if(index > 0 && (instructionData.entryTrackType == undefined)) {
      instructionData.entryTrackType = this.instructions()[index-1].exitTrackType;
      instructionData.exitTrackType = instructionData.entryTrackType;
    }
  }

  /*
    This function handles' listening to input on the roadbook description
    and persisting it to the roadbook object
    TODO controller function
  */
  descriptionInputListener(){
    var _this = this;
    this.descriptionTextEditor = new Quill('#description-editor');
    this.descriptionTextEditor.addModule('toolbar', {
      container: '#description-toolbar'     // Selector for toolbar container
    });
    this.descriptionTextEditor.on('text-change', function(delta, source) {
      var newValue = _this.descriptionTextEditor.getHTML()
      _this.desc(newValue);
    });
  }

  reindexWaypoints(){
    for(var i = 0; i < this.instructions().length; i++){
      var instruction = this.instructions()[i];
      instruction.id = i + 1; //we don't need no zero index
    }
  }

  /*
    ---------------------------------------------------------------------------
      Roadbook edit control flow
    ---------------------------------------------------------------------------
  */
  // NOTE controller function
  requestWaypointEdit(instruction){
    if(instruction != this.currentlyEditingWaypoint){ //we need this to discard click events fired from editing the instruction tulip canvas
      this.finishWaypointEdit(); //clear any existing UI just to be sure
      $('#save-roadbook').removeClass('secondary');
      this.currentlyEditingWaypoint = instruction;
      $('#note-editor').html(instruction.noteHTML());
      $('#notification-bubble').val((instruction.notification ? instruction.notification.bubble : null));
      $('#notification-modifier').val((instruction.notification ? instruction.notification.modifier : null));
      $('#note-editor-container').toggleClass('hideCap',!instruction.showHeading());
      this.instructionShowHeading(instruction.showHeading());
      // app.glyphControls.bindNoteGlyphResizable();
      app.mapController.setMapCenter({lat: instruction.lat(), lng: instruction.lng()});
      if(app.mapController.getMapZoom() < 18){
        app.mapController.setMapZoom(18);
      }

      $('#roadbook-waypoints').children().hide();
      $(instruction.element).show();
      $('#roadbook').scrollTop(instruction.element.position().top - 80)
      $('#waypoint-palette').slideDown('slow');
      $(instruction.element).find('.waypoint-note').append($('#note-editor-container'));
      $('#roadbook').css('padding-bottom', '0');
      $('#roadbook').find('.roadbook-info').hide();
      if(instruction.notification){
        $('#notification-options').removeClass('hidden');
      }
      return true;
    }
  }

  finishWaypointEdit(){
    if(this.currentlyEditingWaypoint !== null){
      this.resetWaypointPalette(this.currentlyEditingWaypoint);
      this.updateWaypointAfterEdit(this.currentlyEditingWaypoint);
      this.currentlyEditingWaypoint = null;
      $('#note-editor').html('');
    }
    return true;
  }
  // NOTE controller function
  resetWaypointPalette(instruction){
    $('.waypoint.row').show();
    $('#waypoint-palette').find('.note-tools').append($('#note-editor-container'));
    $('#waypoint-palette').slideUp('slow');
    $('.added-track-selector').removeClass('active');
    $($('.added-track-selector')[1]).addClass('active');
    $('#roadbook').css('padding-bottom', '150%');
    $('#roadbook').find('.roadbook-info').show();
    $('#notification-options').addClass('hidden');
    $('#roadbook').scrollTop(instruction.element.position().top - 80);
  }

  updateWaypointAfterEdit(instruction){
    instruction.changeAddedTrackType('track');
    instruction.noteHTML($('#note-editor').html());
    if(instruction.notification){
      instruction.notification.bubble = $('#notification-bubble').val();
      instruction.notification.modifier = $('#notification-modifier').val();
    }
    instruction.tulip.finishEdit();
    instruction.tulip.finishRemove();
  }

  updateTotalDistance(){
    if(this.instructions().length > 0 ){
      this.totalDistance(this.instructions()[this.instructions().length - 1].totalDistance());
    } else{
      this.totalDistance(0);
    }
  }

  /*
    ---------------------------------------------------------------------------
      Roadbook persistence
    ---------------------------------------------------------------------------
  */
  // Returns a json representation of the roadbook with all geographic data and elements which capture the edited state of the roadbook.
  // This can be reloaded into app for futher editing
  statefulJSON(){
    var roadbookJSON = {
      name: this.name(),
      desc: this.desc(),
      totalDistance: this.totalDistance(),
      filePath: this.filePath,
      instructions: [],
    }
    points = app.mapModel.markers
    // TODO fold instruction into object instead of boolean so we aren't saving nulls
    for(i = 0; i < points.length; i++){
        var instructionJSON = {
          lat: points[i].getPosition().lat(),
          long: points[i].getPosition().lng(),
          instruction: points[i].instruction ? true : false,
          kmFromStart: points[i].instruction ? points[i].instruction.kmFromStart() : null,
          kmFromPrev: points[i].instruction ? points[i].instruction.kmFromPrev() : null,
          heading: points[i].instruction ? points[i].instruction.exactHeading() : null,
          showHeading: points[i].instruction ? points[i].instruction.showHeading() : null,
          entryTrackType: points[i].instruction ? points[i].instruction.entryTrackType : null,
          exitTrackType: points[i].instruction ? points[i].instruction.exitTrackType : null,
          notification: points[i].instruction && points[i].instruction.notification  ? points[i].instruction.notification : null,
          notes: {
            text: points[i].instruction ? points[i].instruction.noteHTML() : null,
          },
          tulipJson: points[i].instruction ? points[i].instruction.serializeTulip() : null,
        }
        roadbookJSON.instructions.push(instructionJSON);
    }
    return roadbookJSON;
  }

  // Returns the roadbook with only neccessary information to display the roadbook
  // as the rider will see it.
  statelessJSON(){
    var roadbookJSON = {
      name: this.name(),
      desc: this.desc(),
      totalDistance: this.totalDistance(),
      filePath: this.filePath,
      instructions: [],
    }
    points = app.mapModel.markers
    // TODO fold instruction into object instead of boolean so we aren't saving nulls
    for(i = 0; i < points.length; i++){
      if(points[i].instruction){
        var instructionJSON = {
          lat: points[i].getPosition().lat(),
          long: points[i].getPosition().lng(),
          instruction: points[i].instruction ? true : false,
          kmFromStart: points[i].instruction.kmFromStart(),
          kmFromPrev: points[i].instruction.kmFromPrev(),
          heading: points[i].instruction.exactHeading(),
          showHeading: points[i].instruction.showHeading(),
          notes: {
            text: points[i].instruction.noteHTML(),
          },
          tulip: points[i].instruction.tulipPNG(),
        }
        roadbookJSON.instructions.push(instructionJSON);
      }

    }
    return roadbookJSON;
  }

};
