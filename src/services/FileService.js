/*
  ---------------------------------------------------------------------------
  FileService - Handles all file I/O operations

  Responsibilities:
  - File open/save dialogs
  - Reading and writing files
  - File path management
  - Wraps Electron dialog and Node.js fs APIs

  Following the Service-Oriented Architecture pattern from Phase 2.
  All file system operations are isolated in this service.
  ---------------------------------------------------------------------------
*/

var FileService = Class({

  create: function() {
    this.dialog = require('@electron/remote').dialog;
    this.fs = require('fs');
    this.fsPromises = require('fs').promises;
  },

  /*
    Show open file dialog

    Parameters:
    - options: { filters: [{ name: string, extensions: [string] }] }

    Returns: Promise<string[]> - Array of selected file paths, or undefined if cancelled
  */
  showOpenDialog: function(options) {
    return this.dialog.showOpenDialog(options);
  },

  /*
    Show save file dialog

    Parameters:
    - options: { title: string, defaultPath: string, filters: [...] }

    Returns: Promise<string> - Selected file path, or undefined if cancelled
  */
  showSaveDialog: function(options) {
    return this.dialog.showSaveDialog(options);
  },

  /*
    Read file contents (callback-based, for compatibility)

    Parameters:
    - filePath: string
    - encoding: string (default: 'utf-8')
    - callback: function(err, data)
  */
  readFile: function(filePath, encoding, callback) {
    this.fs.readFile(filePath, encoding, callback);
  },

  /*
    Read file contents (Promise-based)

    Parameters:
    - filePath: string
    - encoding: string (default: 'utf-8')

    Returns: Promise<string> - File contents
  */
  readFileAsync: async function(filePath, encoding) {
    encoding = encoding || 'utf-8';
    return await this.fsPromises.readFile(filePath, encoding);
  },

  /*
    Write file contents (callback-based, for compatibility)

    Parameters:
    - filePath: string
    - data: string
    - callback: function(err)
  */
  writeFile: function(filePath, data, callback) {
    this.fs.writeFile(filePath, data, callback);
  },

  /*
    Write file contents (Promise-based)

    Parameters:
    - filePath: string
    - data: string

    Returns: Promise<void>
  */
  writeFileAsync: async function(filePath, data) {
    return await this.fsPromises.writeFile(filePath, data, 'utf-8');
  },

  /*
    Open a roadbook file
    Shows file dialog, reads file, and returns parsed JSON

    Parameters:
    - callback: function(err, data, filePath)
  */
  openRoadbookFile: function(callback) {
    var _this = this;

    this.showOpenDialog({
      filters: [{ name: 'tulip', extensions: ['tlp'] }]
    }).then(function(result) {
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return;
      }

      var filePath = result.filePaths[0];

      _this.readFile(filePath, 'utf-8', function(err, data) {
        if (err) {
          callback(err, null, null);
          return;
        }

        try {
          var json = JSON.parse(data);
          callback(null, json, filePath);
        } catch (parseErr) {
          callback(parseErr, null, null);
        }
      });
    }).catch(function(err) {
      callback(err, null, null);
    });
  },

  /*
    Save a roadbook file
    Shows save dialog and writes JSON data

    Parameters:
    - title: string
    - defaultPath: string
    - data: object (will be JSON.stringify'd)
    - callback: function(err, filePath)
  */
  saveRoadbookFile: function(title, defaultPath, data, callback) {
    var _this = this;

    this.showSaveDialog({
      title: title,
      defaultPath: defaultPath,
      filters: [{ name: 'tulip', extensions: ['tlp'] }]
    }).then(function(result) {
      if (result.canceled || !result.filePath) {
        callback(null, null);
        return;
      }

      var filePath = result.filePath;
      var jsonString = JSON.stringify(data, null, 2);

      _this.writeFile(filePath, jsonString, function(err) {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, filePath);
      });
    }).catch(function(err) {
      callback(err, null);
    });
  },

  /*
    Import a GPX file
    Shows file dialog and reads GPX content

    Parameters:
    - callback: function(err, data)
  */
  importGPXFile: function(callback) {
    var _this = this;

    this.showOpenDialog({
      filters: [{ name: 'import gpx', extensions: ['gpx'] }]
    }).then(function(result) {
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return;
      }

      var filePath = result.filePaths[0];

      _this.readFile(filePath, 'utf-8', function(err, data) {
        callback(err, data);
      });
    }).catch(function(err) {
      callback(err, null);
    });
  }

});
