/*
  ---------------------------------------------------------------------------
  RoadbookController - Coordinates roadbook operations

  Responsibilities:
  - Coordinate roadbook file operations (open, save, save as)
  - Coordinate exports (GPX, OpenRally GPX, PDF)
  - Manage roadbook state and persistence
  - Handle roadbook-related user interactions

  Following the Service-Oriented Architecture pattern from Phase 4.
  This controller orchestrates between Services, Models, and Views.
  ---------------------------------------------------------------------------
*/

function RoadbookController(roadbook, fileService, exportService, dialogService, ipcService, eventBus, uiController) {
  this.roadbook = roadbook;
  this.fileService = fileService;
  this.exportService = exportService;
  this.dialogService = dialogService;
  this.ipcService = ipcService;
  this.eventBus = eventBus;
  this.uiController = uiController;
}

/*
  ---------------------------------------------------------------------------
  File Operations
  ---------------------------------------------------------------------------
*/

/*
  Open a roadbook file
  Shows file dialog, loads roadbook, and updates UI
*/
RoadbookController.prototype.openRoadbook = function() {
  var _this = this;

  this.fileService.openRoadbookFile(function(err, json, filePath) {
    if (err) {
      _this.dialogService.showError('Failed to open roadbook', err.message);
      _this.eventBus.emit(EventBus.Events.ERROR_OCCURRED, { context: 'openRoadbook', error: err });
      return;
    }

    if (json && filePath) {
      // Trigger loading UI
      app.startLoading();

      // Load roadbook data
      _this.roadbook.appendRouteFromJSON(json, filePath);

      // Emit event (Phase 5: EventBus)
      _this.eventBus.emit(EventBus.Events.ROADBOOK_LOADED, { roadbook: _this.roadbook, filePath: filePath });

      // Update UI (Phase 6: delegate to UIController)
      _this.uiController.expandRoadbook();
      _this.uiController.closeMenu();
      _this.uiController.enableExportButtons();
    }
  });
};

/*
  Save the current roadbook
  If no file path exists, triggers save as
*/
RoadbookController.prototype.saveRoadbook = function() {
  var _this = this;

  if (this.roadbook.filePath == null) {
    // Request documents directory path for first-time save
    this.ipcService.send('get-documents-path');
  } else {
    this.roadbook.finishWaypointEdit();
    var data = JSON.stringify(this.roadbook.statefulJSON(), null, 2);

    this.fileService.writeFile(this.roadbook.filePath, data, function(err) {
      if (err) {
        _this.dialogService.showError('Failed to save roadbook', err.message);
        _this.eventBus.emit(EventBus.Events.ERROR_OCCURRED, { context: 'saveRoadbook', error: err });
      } else {
        // Emit event (Phase 5: EventBus)
        _this.eventBus.emit(EventBus.Events.ROADBOOK_SAVED, { roadbook: _this.roadbook });
      }
    });
  }
};

/*
  Save roadbook as a new file
  Shows save dialog and saves to selected location
*/
RoadbookController.prototype.saveRoadbookAs = function() {
  if (this.roadbook.filePath == null) {
    // Request documents directory path
    this.ipcService.send('get-documents-path');
  } else {
    this.showSaveDialog('Save roadbook as', this.roadbook.filePath);
  }
};

/*
  Show save dialog and save roadbook

  Parameters:
  - title: string
  - defaultPath: string
*/
RoadbookController.prototype.showSaveDialog = function(title, defaultPath) {
  var _this = this;

  this.fileService.saveRoadbookFile(title, defaultPath, this.roadbook.statefulJSON(), function(err, filePath) {
    if (err) {
      _this.dialogService.showError('Failed to save roadbook', err.message);
      return;
    }

    if (filePath) {
      // Update roadbook file path
      _this.roadbook.filePath = filePath;
    }
  });
};

/*
  ---------------------------------------------------------------------------
  Export Operations
  ---------------------------------------------------------------------------
*/

/*
  Check if roadbook can be exported
  Returns: boolean
*/
RoadbookController.prototype.canExport = function() {
  return this.roadbook.filePath != null;
};

/*
  Export roadbook to GPX format
*/
RoadbookController.prototype.exportGPX = function() {
  var _this = this;

  if (this.canExport()) {
    // Emit event (Phase 5: EventBus)
    this.eventBus.emit(EventBus.Events.EXPORT_STARTED, { type: 'gpx' });

    this.exportService.exportGPX(this.roadbook.filePath, function(err, outputPath) {
      if (err) {
        _this.dialogService.showError('Failed to export GPX', err.message);
        _this.eventBus.emit(EventBus.Events.EXPORT_FAILED, { type: 'gpx', error: err });
        return;
      }

      // Close menu (Phase 6: delegate to UIController)
      _this.uiController.closeMenu();
      _this.dialogService.alert('Your GPX has been exported to the same directory you saved your roadbook');

      // Emit event (Phase 5: EventBus)
      _this.eventBus.emit(EventBus.Events.EXPORT_COMPLETED, { type: 'gpx', outputPath: outputPath });
    });
  } else {
    this.dialogService.alert('F@#k1ng Kamaz! You must save your roadbook before you can export GPX tracks');
  }
};

/*
  Export roadbook to OpenRally GPX format
*/
RoadbookController.prototype.exportOpenRallyGPX = function() {
  var _this = this;

  if (this.canExport()) {
    this.exportService.exportOpenRallyGPX(this.roadbook.filePath, function(err, outputPath) {
      if (err) {
        _this.dialogService.showError('Failed to export OpenRally GPX', err.message);
        return;
      }

      // Close menu (Phase 6: delegate to UIController)
      _this.uiController.closeMenu();
      _this.dialogService.alert('Your GPX has been exported to the same directory you saved your roadbook');
    });
  } else {
    this.dialogService.alert('F@#k1ng Kamaz! You must save your roadbook before you can export GPX tracks');
  }
};

/*
  Import GPX file
*/
RoadbookController.prototype.importGPX = function() {
  var _this = this;

  this.exportService.importGPX(function(err) {
    if (err) {
      _this.dialogService.showError('Failed to import GPX', err.message);
      app.stopLoading();
      return;
    }

    app.startLoading();
    // Close menu (Phase 6: delegate to UIController)
    _this.uiController.closeMenu();
  });
};

/*
  Export roadbook to PDF
*/
RoadbookController.prototype.printRoadbook = function() {
  if (this.canExport()) {
    // Close menu (Phase 6: delegate to UIController)
    this.uiController.closeMenu();
    this.ipcService.send('ignite-print', app.roadbook.statelessJSON());
  } else {
    this.dialogService.alert('You must save your roadbook before you can export it as a PDF');
  }
};

/*
  Export lexicon key to PDF
*/
RoadbookController.prototype.printLexicon = function() {
  if (this.canExport()) {
    // Close menu (Phase 6: delegate to UIController)
    this.uiController.closeMenu();
    this.ipcService.send('ignite-lexicon', app.roadbook.filePath);
  } else {
    this.dialogService.alert('You must save your roadbook before you can save the Lexicon. No, really. Sorry.');
  }
};

/*
  ---------------------------------------------------------------------------
  Utility Methods
  ---------------------------------------------------------------------------
*/

/*
  Check if roadbook can be saved
  Returns: boolean
*/
RoadbookController.prototype.canSave = function() {
  var can = this.roadbook.finishWaypointEdit();
  can = can || this.roadbook.newWaypoints;
  can = can || this.roadbook.finishNameDescEdit();
  return can;
};
