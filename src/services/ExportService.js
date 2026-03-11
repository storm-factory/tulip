/*
  ---------------------------------------------------------------------------
  ExportService - Handles GPX and PDF export operations

  Responsibilities:
  - Export roadbook to GPX format
  - Export roadbook to OpenRally GPX format
  - Coordinate export file paths
  - Write export files

  Following the Service-Oriented Architecture pattern from Phase 2.
  Export logic is centralized in this service.

  Note: Currently delegates to existing Io module for conversion.
  In Phase 3, conversion logic will be moved into this service.
  ---------------------------------------------------------------------------
*/

var ExportService = Class({

  create: function(io, fileService) {
    this.io = io;
    this.fileService = fileService;
  },

  /*
    Export roadbook to GPX format

    Parameters:
    - roadbookFilePath: string - Path to the roadbook file
    - callback: function(err, outputPath)
  */
  exportGPX: function(roadbookFilePath, callback) {
    var _this = this;

    try {
      // Generate GPX content (delegates to Io module)
      var gpxContent = this.io.exportGPX();

      // Generate output file path
      var outputPath = roadbookFilePath.replace('tlp', 'gpx');

      // Write file
      this.fileService.writeFile(outputPath, gpxContent, function(err) {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, outputPath);
      });
    } catch (error) {
      callback(error, null);
    }
  },

  /*
    Export roadbook to OpenRally GPX format

    Parameters:
    - roadbookFilePath: string - Path to the roadbook file
    - callback: function(err, outputPath)
  */
  exportOpenRallyGPX: function(roadbookFilePath, callback) {
    var _this = this;

    try {
      // Generate OpenRally GPX content (delegates to Io module)
      var gpxContent = this.io.exportOpenRallyGPX();

      // Generate output file path
      var outputPath = roadbookFilePath.replace('.tlp', '-openrally.gpx');

      // Write file
      this.fileService.writeFile(outputPath, gpxContent, function(err) {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, outputPath);
      });
    } catch (error) {
      callback(error, null);
    }
  },

  /*
    Import GPX file

    Parameters:
    - callback: function(err)
  */
  importGPX: function(callback) {
    var _this = this;

    this.fileService.importGPXFile(function(err, data) {
      if (err) {
        callback(err);
        return;
      }

      if (data) {
        try {
          // Delegate to Io module for processing
          _this.io.importGPX(data);
          callback(null);
        } catch (importErr) {
          callback(importErr);
        }
      }
    });
  }

});
