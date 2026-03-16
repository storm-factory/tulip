'use strict';
// TODO refactor this to use MVC pattern and act as a model for the roadbook all UI interaction should be moved to an application controller, also change to ES6 syntax
// TODO rename instructions to instructions
class RoadbookModel {
  constructor() {
    /*
      declare some state instance variables
    */
    this.currentlyEditingInstruction = null;
    this.editingNameDesc = false;
    this.selectedInstruction = null;

    /*
      Declare some internal variables
    */
    // TODO how do we handle file name changes
    this.filePath = null;
  }

  /*
    ---------------------------------------------------------------------------
      Instruction management
    ---------------------------------------------------------------------------
  */

  newRoadbook() {
    this.name('Name your roadbook');
    this.desc('Describe your roadbook');
    this.totalDistance(0);
    this.customLogo(null)
    this.filePath = null;
    const delta = this.controller.descriptionTextEditor.clipboard.convert({ html: this.desc() });
    this.controller.descriptionTextEditor.setContents(delta);
  }

  updateName = function (rb, event) {
    var newValue = event.target.innerText.trim();
    if (rb.name() != newValue) {
      this.name(newValue || 'Name your roadbook');
      this.controller.isSaved(false);
    }
  }

  addInstruction(instructionData) {

    this.finishInstructionEdit(); //TODO make callback?

    var index = this.determineInstructionInsertionIndex(instructionData.kmFromStart);
    this.determineInstructionTrackTypes(index, instructionData);

    var instruction = this.instantiateInstruction(instructionData);

    this.instructions.splice(index, 0, instruction);
    this.reindexInstructions();

    this.controller.highlightSaveButton();

    return instruction;
  }

  appendRouteFromJSON(json, fileName) {
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.customLogo(json.customLogo);
    this.filePath = fileName
    var points = json.instructions || json.waypoints;

    if (points.length == 0)
      return;
    const trackTypeMap = {
      "offPiste": "offPiste",
      "track": "smallTrack",
      "road": "track",
      "mainRoad": "tarmacRoad",
      "dcw": "dcw"
    }
    var updateTracktypes = this.needsTrackTypeUpdate(points);
    // NOTE: For some strange reason, due to canvas rendering, a for loop causes points and instructions to be skipped, hence for...of in
    for (var point of points) {
      var latLng = new google.maps.LatLng(point.lat, point.long)
      var marker = app.mapModel.addRoutePoint(latLng, app.mapController.map)
      if (point.instruction || point.waypoint) {
        if (updateTracktypes) {
          point.entryTrackType = trackTypeMap[point.entryTrackType];
          point.exitTrackType = trackTypeMap[point.exitTrackType];
        }

        app.mapModel.setMarkerIconToInstructionIcon(marker);
        point.routePointIndex = marker.routePointIndex; //refactor to persist this
        marker.instruction = this.appendInstruction(this.assignTrackType(point));
      }
    }
    this.reindexInstructions();
    // NOTE this is less than ideal
    if (this.desc() !== null) {
      const delta = this.controller.descriptionTextEditor.clipboard.convert({ html: this.desc() });
      this.controller.descriptionTextEditor.setContents(delta);
    }
    app.mapModel.updateAllMarkersInstructionGeoData();
    var latLng = new google.maps.LatLng(points[0].lat, points[0].long);

    const bounds = new google.maps.LatLngBounds();
    app.mapModel.markers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    app.mapController.fitBounds(bounds);
    app.mapController.map.setZoom(app.mapController.map.getZoom() - 1);
  }

  needsTrackTypeUpdate(instructions) {
    return instructions.some(function (i, index) {
      if (['road', 'mainRoad'].includes(i.entryTrackType) || ['road', 'mainRoad'].includes(i.exitTrackType)) {
        console.log("Track types will be updated")
        return true;
      }
    });
  }

  assignTrackType(point) {
    for (var track in point.tulipJson.tracks) {
      if (point.tulipJson.tracks[track].type)
        continue; // already migrated
      // determine track type from graphics
      if (point.tulipJson.tracks[track].paths[0].strokeDashArray.length == 4) {
        point.tulipJson.tracks[track].type = 'lowVisTrack';
      }
      if (point.tulipJson.tracks[track].paths[0].strokeDashArray.length == 2) {
        point.tulipJson.tracks[track].type = 'offPiste';
      }
      if (point.tulipJson.tracks[track].paths[0].strokeDashArray.length == 0) {
        if (point.tulipJson.tracks[track].paths.length == 1) { // solid line
          point.tulipJson.tracks[track].paths[0].strokeWidth == 6 ? point.tulipJson.tracks[track].type = 'track' : point.tulipJson.tracks[track].type = 'smallTrack';
        }
        if (point.tulipJson.tracks[track].paths.length == 2) { // double line
          point.tulipJson.tracks[track].type = 'tarmacRoad';
        }
        if (point.tulipJson.tracks[track].paths.length > 2) { // highway
          point.tulipJson.tracks[track].type = 'dcw';
        }
      }
    }
    return point;
  }

  appendInstruction(wptData) {
    var instruction = new Instruction(this, wptData);
    this.instructions.push(instruction);
    return instruction;
  }

  bindToKnockout() {
    var _this = this;
    /*
      declare some observable instance variables
    */
    this.name = ko.observable('Name your roadbook');
    this.desc = ko.observable('Describe your roadbook');
    this.customLogo = ko.observable('');
    this.totalDistance = ko.observable('0.00');
    this.fuelRange = ko.observable('0.0');

    this.instructions = ko.observableArray([]);
    this.instructionShowHeading = ko.observable(true);
    this.instructionShowCoordinates = ko.observable(true);

    this.isDrawing = ko.observable(false);
    this.isDrawing.subscribe(function (drawing) {
      if (app.roadbook.currentlyEditingInstruction) {
        app.roadbook.currentlyEditingInstruction.tulip.canvas.isDrawingMode = drawing;
        app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush.width = 3;
        app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush.fill = _this.isPathFilled() ? _this.fillColor() : null;
        app.roadbook.currentlyEditingInstruction.note.canvas.isDrawingMode = drawing;
        app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush.width = 3;
        app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush.fill = _this.isPathFilled() ? _this.fillColor() : null;
      }
    });
    this.toggleDrawing = function () {
      this.isDrawing(!this.isDrawing());
    }
    this.brushWidth = ko.observable(3);
    this.brushColor = ko.observable("#000000");
    this.isPathFilled = ko.observable(false);
    this.fillColor = ko.observable("#d3d3d3");

    this.isPathFilled.subscribe(function(shouldFill) {
        if(app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush.fill = shouldFill ? _this.fillColor() : null;
        }
        if(app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush.fill = shouldFill ? _this.fillColor() : null;
        }
    });

    this.fillColor.subscribe(function(shouldFill) {
        if(app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush.fill = shouldFill ? _this.fillColor() : null;
        }
        if(app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush.fill = shouldFill ? _this.fillColor() : null;
        }
    });

    this.brushColor.subscribe(function(newColor) {
        if(app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush.color = newColor;
        }
        if(app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush.color = newColor;
        }
    });
    this.brushWidth.subscribe(function(brushWidth) {
        if(app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.tulip.canvas.freeDrawingBrush.width = brushWidth;
        }
        if(app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush) {
            app.roadbook.currentlyEditingInstruction.note.canvas.freeDrawingBrush.width = brushWidth;
        }
    });

    this.canvasSelectedItemType = ko.observable(null);
  }

  changeEditingInstructionAdded(type) {
    this.currentlyEditingInstruction.changeAddedTrackType(type);
  }

  changeEditingInstructionEntry(type) {
    var instruction = this.currentlyEditingInstruction;
    instruction.changeEntryTrackType(type);
    var instructionIndex = this.instructions().indexOf(instruction)
    //if it's the first instruction we can't change the previous instruction exit
    // TODO loop until the track type changes
    if (instructionIndex > 0) {
      this.instructions()[instructionIndex - 1].changeExitTrackType(type);
      this.instructions()[instructionIndex - 1].tulip.finishEdit();
    }
  }

  changeEditingInstructionExit(type) {
    var instruction = this.currentlyEditingInstruction;
    instruction.changeExitTrackType(type);
    var instructionIndex = this.instructions().indexOf(instruction)
    //if it's the last instruction we can't change the next instruction entry
    // TODO loop until the track type changes
    if ((instructionIndex + 1 < this.instructions().length)) {
      this.instructions()[instructionIndex + 1].changeEntryTrackType(type);
      this.instructions()[instructionIndex + 1].tulip.finishEdit();
    }
  }


  deleteInstruction(index) {
    this.finishInstructionEdit();
    this.instructions.splice(index - 1, 1);
    this.reindexInstructions();
  }

  /*
    Use a binary search algorithm to determine the index to insert the instruction into the roadbook
    instructions array based on the distance from the start
  */
  determineInstructionInsertionIndex(kmFromStart) {
    var minIndex = 0;

    var maxIndex = this.instructions().length - 1;
    var currentIndex;
    var midpoint = this.instructions().length / 2 | 0;
    var currentInstruction;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentInstruction = this.instructions()[currentIndex];

      if (currentInstruction.kmFromStart() < kmFromStart) {
        minIndex = currentIndex + 1;
      }
      else if (currentInstruction.kmFromStart() > kmFromStart) {
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
  determineInstructionTrackTypes(index, instructionData) {
    if (index > 0 && (instructionData.entryTrackType == undefined)) {
      instructionData.entryTrackType = this.instructions()[index - 1].exitTrackType;
      instructionData.exitTrackType = instructionData.entryTrackType;
    }
  }

  instantiateInstruction(instructionData) {
    return new Instruction(this, instructionData);
  }

  reindexInstructions() {
    var inSpeedZone = false;
    var inTransferZone = false;
    var inNeutralizationZone = false;
    var checkpointNumber = 0;
    var waypointNumber = 0;
    var lastReset = 0;
    var refuelKm = 0;
    var fuelRange = 0;
    for (var i = 0; i < this.instructions().length; i++) {
      var instruction = this.instructions()[i];
      var kmFromStart = instruction.kmFromStart();
      instruction.id = i + 1; //we don't need no zero index
      // Update speed zones
      if (instruction.notification) {
        if (["dsz", "dns", "dts"].includes(instruction.notification.type)) {
          inSpeedZone = true;
        }
      }
      instruction.inSpeedZone(inSpeedZone);
      if (instruction.notification) {
        if (["fsz", "fn", "ft"].includes(instruction.notification.type) && inSpeedZone) {
          inSpeedZone = false;
        }
      }
      // Update Transfer Zones
      if (instruction.notification) {
        if (["dt", "dts"].includes(instruction.notification.type)) {
          inTransferZone = true;
        }
      }
      instruction.inTransferZone(inTransferZone);
      if (instruction.notification) {
        if (["ft"].includes(instruction.notification.type) && inTransferZone) {
          inTransferZone = false;
        }
      }
      // Update Neutralization Zones
      if (instruction.notification) {
        if (["dn", "dns"].includes(instruction.notification.type)) {
          inNeutralizationZone = true;
        }
      }
      instruction.inNeutralizationZone(inNeutralizationZone);
      if (instruction.notification) {
        if (["fn"].includes(instruction.notification.type) && inNeutralizationZone) {
          inNeutralizationZone = false;
        }
      }
      // Checkpoint numbering
      if (instruction.notification.type == "cp") {
        checkpointNumber++;
        instruction.checkpointNumber('CP' + checkpointNumber);
      } else {
        instruction.checkpointNumber(false);
      }
      // Waypoint numbering
      if (instruction.notification.type) {
        waypointNumber++;
        instruction.waypointNumber(waypointNumber);
      } else {
        instruction.waypointNumber(false);
      }
      // Handle RESET
      instruction.resetDistance(lastReset);
      if (instruction.hasResetGlyph()) {
        lastReset = kmFromStart;
      }
      // Handle Fuel zone
      if (instruction.hasFuelGlyph()) {
        if ((kmFromStart - refuelKm) > fuelRange) {
          fuelRange = (kmFromStart - refuelKm);
        }
        refuelKm = kmFromStart;
      }
    }
    if ((kmFromStart - refuelKm) > fuelRange) {
      fuelRange = (kmFromStart - refuelKm);
    }
    this.fuelRange(fuelRange.toFixed(1));
  }

  /*
    ---------------------------------------------------------------------------
      Roadbook edit control flow
    ---------------------------------------------------------------------------
  */
  requestInstructionEdit(instruction) {
    if (instruction != this.currentlyEditingInstruction) { //we need this to discard click events fired from editing the instruction tulip canvas
      this.finishInstructionEdit(); //clear any existing UI just to be sure
      this.currentlyEditingInstruction = instruction;
      this.instructionShowHeading(instruction.showHeading());
      this.instructionShowCoordinates(instruction.showCoordinates());
      app.mapController.centerOnInstruction(instruction);
      this.controller.populateInstructionPalette(instruction)

      // When Tulip canvas is clicked, deselect Note canvas
      instruction.tulip.canvas.on('mouse:down', () => {
        instruction.note.canvas.discardActiveObject();
        instruction.note.canvas.renderAll();
      });

      // When Note canvas is clicked, deselect Tulip canvas
      instruction.note.canvas.on('mouse:down', () => {
        instruction.tulip.canvas.discardActiveObject();
        instruction.tulip.canvas.renderAll();
      });
      return true;
    }
  }

  finishInstructionEdit(openRadius, validationRadius, time, stopTime) {
    this.isDrawing(false);
    if (this.currentlyEditingInstruction !== null) {
      this.currentlyEditingInstruction.finishEdit()
      this.updateInstructionAfterEdit(openRadius, validationRadius, time, stopTime);
      this.currentlyEditingInstruction = null;
    }
    this.reindexInstructions();
    return true;
  }

  updateInstructionAfterEdit(openRadius, validationRadius, time, stopTime) {
    // this.currentlyEditingInstruction.changeAddedTrackType('track');
    if (this.currentlyEditingInstruction.notification) {
      this.currentlyEditingInstruction.notification.openRadius = openRadius;
      this.currentlyEditingInstruction.notification.validationRadius = validationRadius;
      this.currentlyEditingInstruction.notification.time = time;
    }
    this.currentlyEditingInstruction.stopTimeSec(stopTime);
    this.currentlyEditingInstruction.tulip.finishEdit();
    this.currentlyEditingInstruction.tulip.finishRemove();
    this.currentlyEditingInstruction.note.finishEdit();
    this.currentlyEditingInstruction.note.finishRemove();
  }

  updateTotalDistance() {
    if (this.instructions().length > 0) {
      this.totalDistance(this.instructions()[this.instructions().length - 1].totalDistance());
    } else {
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
  statefulJSON() {
    var roadbookJSON = {
      name: this.name(),
      desc: this.desc(),
      totalDistance: this.totalDistance(),
      filePath: this.filePath,
      appVersion: app.version,
      schemaVersion: 2,
      customLogo: this.customLogo(),
      instructions: [],
    }
    var points = app.mapModel.markers
    // TODO fold instruction into object instead of boolean so we aren't saving nulls
    for (var i = 0; i < points.length; i++) {
      var instructionJSON = {
        lat: points[i].getPosition().lat(),
        long: points[i].getPosition().lng(),
        instruction: points[i].instruction ? true : false,
        kmFromStart: points[i].instruction ? points[i].instruction.kmFromStart() : null,
        kmFromPrev: points[i].instruction ? points[i].instruction.kmFromPrev() : null,
        heading: points[i].instruction ? points[i].instruction.exactHeading() : null,
        capAvg: points[i].instruction ? points[i].instruction.capAvg() : null,
        showHeading: points[i].instruction ? points[i].instruction.showHeading() : null,
        showCoordinates: points[i].instruction ? points[i].instruction.showCoordinates() : null,
        stopTimeSec: points[i].instruction ? points[i].instruction.stopTimeSec() : null,
        entryTrackType: points[i].instruction ? points[i].instruction.entryTrackType : null,
        exitTrackType: points[i].instruction ? points[i].instruction.exitTrackType : null,
        notification: points[i].instruction && points[i].instruction.notification ? points[i].instruction.notification : null,
        tulipJson: points[i].instruction ? points[i].instruction.serializeTulip() : null,
        noteJson: points[i].instruction ? points[i].instruction.serializeNote() : null,
      }
      roadbookJSON.instructions.push(instructionJSON);
    }
    return roadbookJSON;
  }

  // Returns the roadbook with only neccessary information to display the roadbook
  // as the rider will see it.
  statelessJSON() {
    var roadbookJSON = {
      name: this.name(),
      desc: this.desc(),
      totalDistance: this.totalDistance(),
      fuelRange: this.fuelRange(),
      filePath: this.filePath,
      customLogo: this.customLogo(),
      instructions: [],
    }

    var points = app.mapModel.markers
    // TODO fold instruction into object instead of boolean so we aren't saving nulls
    for (var i = 0; i < points.length; i++) {
      if (points[i].instruction) {
        var instructionJSON = {
          lat: points[i].getPosition().lat(),
          long: points[i].getPosition().lng(),
          instructionNumber: points[i].instruction.instructionNumber(),
          instruction: points[i].instruction ? true : false,
          kmFromStart: points[i].instruction.filteredKmFromStart(),
          kmFromPrev: points[i].instruction.kmFromPrev(),
          heading: points[i].instruction.heading(),
          coordinates: points[i].instruction.coordinates(),
          showHeading: points[i].instruction.showHeading(),
          showCoordinates: points[i].instruction.showCoordinates(),
          closeProximity: points[i].instruction.closeProximity(),
          inSpeedZone: points[i].instruction.inSpeedZone(),
          dangerLevel: points[i].instruction.dangerLevel(),
          hasResetGlyph: points[i].instruction.hasResetGlyph(),
          hasTimedStop: points[i].instruction.hasTimedStop(),
          waypointIcon: points[i].instruction.waypointIcon(),
          waypointColoring: points[i].instruction.waypointColoring(),
          instructionColoring: points[i].instruction.instructionColoring(),
          assignTulipColoring: points[i].instruction.assignTulipColoring(),
          checkpointNumber: points[i].instruction.checkpointNumber(),
          waypointNumber: points[i].instruction.waypointNumber(),
          tulip: points[i].instruction.tulipPNG(),
          note: points[i].instruction.notePNG(),
        }
        roadbookJSON.instructions.push(instructionJSON);
      }
    }
    return roadbookJSON;
  }

  fillZoneSpeedLimit() {
    if (this.selectedInstruction) {
      var idx = this.selectedInstruction - 1;
      var instruction = this.instructions()[idx++];
      var speedLimit = instruction.speedLimit();
      if (instruction.inSpeedZone() && speedLimit) {
        instruction = this.instructions()[idx];
        while (instruction.inSpeedZone()) {
          if (!instruction.speedLimit() && !['fsz', 'fn', 'ft'].includes(instruction.notification.type)) {
            const src = './assets/svg/glyphs/speed-' + speedLimit + '.svg';
            instruction.note.removeSpeedGlyph();
            instruction.note.appendGlyph(src, undefined, false);
          } else {
            const src = './assets/svg/glyphs/speed-' + speedLimit + '-end.svg';
            instruction.note.removeSpeedGlyph(true);
            instruction.note.appendGlyph(src, undefined, false);
            speedLimit = instruction.speedLimit();
          }
          instruction = this.instructions()[++idx];
        }
      }
    }
  }
};
/*
  Node exports for test suite
*/
if (typeof window == 'undefined') {
  module.exports.roadbookModel = RoadbookModel;
}
