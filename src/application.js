/*
  ---------------------------------------------------------------------------
  Define the application object as a singleton

  This class is the main IO interface between the user an the application

  Logically the Heirarchy of Application structure is:
    -> Application
     Modules:
     -> Mapping
      -> Roadbook
       -> Waypoint
        -> Tulip
         -> TrackEditor

    The Application handles bootstrapping the user interface and any non Mapping
    function. The UI is mainly composed of the UI Map which is managed by the
    MapController and MapModel objects. The MapController creates Waypoints based off interaction.
    Each Waypoint has a Tulip which is uses the TrackEditor class to handle the complexity
    of editing tracks.
  ---------------------------------------------------------------------------
*/

class App {
  constructor() {
    /*
      declare some state instance variables
    */
    this.glyphPlacementPosition = { top: 30, left: 30 };
    this.canEditMap = true;
    this.pointDeleteMode = false;
    this.documentPath = false;

    /*
      IPC to Main process
    */
    this.ipc = globalNode.ipcRenderer;

    /*
      instantiate the roadbook
      TODO rename variable
    */
    this.roadbook = new RoadbookModel();
    this.roadbook.bindToKnockout();

    this.roadbookController = new RoadbookController(this.roadbook);
    this.roadbook.controller = this.roadbookController;

    const viewModel = {
      isSaved: this.roadbookController.isSaved, // Bind to roadbookController's observable
    };
    this.roadbookController.isSaved.subscribe((newValue) => {
      this.ipc.send('update-saved-state', newValue);
    });
    /*
      instantiate import/export
    */
    this.io = new Io();

    /*
      file io
    */
    this.fs = globalNode.fs;

    this.version = globalNode.getVersion()
    this.schemaVersion = 2;

    /*
      initialize UI listeners
    */

    this.initListeners();

    this.noteControls = new NoteControls();

    this.settings = this.loadSettings();

    this.glyphStructure = JSON.parse(this.fs.readFileSync(globalNode.getAppPath() + '/src/modules/glyphs.json', 'utf8'));
    this.glyphControls = new GlyphControls(this.glyphStructure);
    if (this.settings.user_glyph_path)
      this.ipc.send('get-user-glyphs', this.settings.user_glyph_path)

    this.ipc.send('get-documents-path');
  }

  /*
    ---------------------------------------------------------------------------
    App persistence
    TODO create a persistence module and move this into it.
    ---------------------------------------------------------------------------
  */

  canExport() {
    var can;
    can = this.roadbook.filePath != null;
    return can
  }

  canSave() {
    var can;
    can = this.roadbook.finishInstructionEdit();
    can = can || this.roadbook.finishNameDescEdit();
    return can;
  }

  openLastRoadBook() {
    const fileName = localStorage.getItem('lastRoadBook');
    this.ipc.send('check-file-existence', fileName);

    this.ipc.on('file-exists', (event, fileName) => {
      localStorage.setItem('lastRoadBook', fileName);
      this.loadRoadBook(fileName);
    });
  }

  loadRoadBook(fileName, append = false) {
    var _this = this;

    _this.startLoading();
    //TODO this needs to be passed to create when choice is added
    //we need to figure out how to watch a file while it's being edited so if it's moved it gets saved to the right place ***fs.watch***
    _this.fs.readFile(fileName, 'utf-8', function (err, data) {
      if (err) {
        _this.stopLoading();
        globalNode.dialog().showMessageBoxSync({
          message: err.message,
          type: 'error',
          buttons: ['OK']
        });
        return;
      }
      try {
        var json = JSON.parse(data.replaceAll("{user_glyphs_path}", _this.settings.user_glyph_path ?? ""));
        if (!_this.checkRoadbookVersion(json))
          return
        if (!append) {
          _this.newRoadbook()
        }
        _this.roadbook.appendRouteFromJSON(json, fileName); //TODO this needs to only pass json once choice is added   
        _this.roadbook.updateTotalDistance();
        localStorage.setItem('lastRoadBook', fileName);
      } catch (error) {
        console.error(error);
      }
    });
    _this.showRoadbook();
    $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
    this.updateWindowTitle(fileName);
    this.ipc.send('save-recent-filename', fileName);
  }

  checkRoadbookVersion(json) {
    var _this = this;
    var schemaVersion;
    if (!json.schemaVersion) {
      schemaVersion = (json.appVersion == '1.10.0' ? 2 : 1)
    } else {
      schemaVersion = json.schemaVersion;
    }
    console.log("Schema version:", schemaVersion);
    if (schemaVersion < this.schemaVersion) {
      globalNode.dialog().showMessageBoxSync({
        message: "This is a roadbook from an old Tulip version\n\nRoadbook schema has changed to accommodate new notes format, saving this roadbook will make it incompatible with versions 1.9.6 and earlier.\
        \n1.Make a backup or save under new name\n2.Check roadbook glyphs for size and position.\n3.See changelog for details",
        type: 'info',
        buttons: ['Understood']
      })
    }
    if (schemaVersion > this.schemaVersion) {
      globalNode.dialog().showMessageBoxSync({
        message: "This roadbook has been created with a later version of Tulip and cannot be loaded.\n\Please update Tulip",
        type: 'info',
        buttons: ['OK']
      });
      return false;
    }
    return true;
  }

  openRoadBook(append = false) {
    var _this = this;
    var defaultPath = "";
    try {
      defaultPath = localStorage.getItem('lastRoadBook').match(/^(.*[\\/])/)[1];
    } catch { }
    globalNode.dialog().showOpenDialog({
      'title': 'Open Roadbook',
      'defaultPath': defaultPath,
      properties: ['openFile'],
      filters: [
        { name: 'tulip', extensions: ['tlp'] }
      ]
    }).then(openInfo => {
      if (openInfo.canceled) return;

      var fs = globalNode.fs;
      var fileNames = openInfo.filePaths;

      if (fileNames === undefined)
        return;

      _this.loadRoadBook(fileNames[0], append)
    });
  }

  openRoadBookLogo() {
    var _this = this;
    globalNode.dialog().showOpenDialog({
      filters: [
        { name: 'Image files', extensions: ['png', 'jpg', 'jpeg'] }
      ]
    }).then(openInfo => {
      if (openInfo.canceled) return;

      var fs = globalNode.fs;
      var fileNames = openInfo.filePaths;

      if (fileNames === undefined)
        return;

      _this.loadRoadBookLogo(fileNames[0])
    });
  }

  loadRoadBookLogo(fileName) {
    var _this = this;

    _this.fs.readFile(fileName, null, function (err, data) {
      var imageType = fileName.split('.').pop();
      var imgSrc = "data:image/" + imageType + ";base64," + globalNode.uint8ArrayToBase64(data);
      _this.roadbook.customLogo(imgSrc);
    });
  }

  openUserGlyphFolder() {
    var _this = this;
    globalNode.dialog().showOpenDialog({
      title: 'Select user glyphs folder',
      defaultPath: localStorage.getItem('lastRoadBook')?.match(/^(.*[\\/])/)[1],
      buttonLabel: 'Select Folder',          // custom button text
      properties: ['openDirectory', 'createDirectory'] // createDirectory lets user make new folder
    }).then(openInfo => {
      if (openInfo.canceled) return;

      var glyphsPath = openInfo.filePaths[0];

      if (glyphsPath === undefined)
        return;

      _this.settings.user_glyph_path = glyphsPath;
      $('#user_glyph_path_text').text(glyphsPath);
      _this.requestUserGlyphsUpdate(glyphsPath);
    });
  }

  requestUserGlyphsUpdate(glyphsPath = null) {
    if (!glyphsPath)
      glyphsPath = this.settings.user_glyph_path || null;
    if (glyphsPath)
      this.ipc.send('get-user-glyphs', glyphsPath);
  }

  exportGPX() {
    if (this.canExport()) {
      var gpx = this.io.exportGPX();
      var filename = this.roadbook.filePath.replace('tlp', 'gpx');
      globalNode.fs.writeFile(filename, gpx, function (err) { });
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      globalNode.dialog().showMessageBoxSync({
        message: "Your gpx has been exported to the same directory you saved your roadbook",
        type: 'info',
        buttons: ['OK']
      });
    } else {
      globalNode.dialog().showMessageBoxSync({
        message: "You must save your roadbook before you can export GPX tracks",
        type: 'info',
        buttons: ['OK']
      });
    }
  }

  exportOpenRallyGPX() {
    if (this.canExport()) {
      var gpx = this.io.exportOpenRallyGPX(this.settings.openRallyStrict);

      var filename = this.roadbook.filePath.replace('.tlp', '-openrally.gpx');

      globalNode.fs.writeFile(filename, gpx, function (err) { });

      console.log("exported openrally gpx to", filename);

      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      globalNode.dialog().showMessageBoxSync({
        message: "Your gpx has been exported to the same directory you saved your roadbook",
        type: 'info',
        buttons: ['OK']
      });
    } else {
      globalNode.dialog().showMessageBoxSync({
        message: "You must save your roadbook before you can export GPX tracks",
        type: 'info',
        buttons: ['OK']
      });
    }
  }

  importGPX() {
    var _this = this;

    globalNode.dialog().showOpenDialog({
      filters: [
        { name: 'import gpx', extensions: ['gpx'] }
      ]
    }).then(openInfo => {
      var fileNames = openInfo.filePaths;

      if (fileNames === undefined)
        return;

      _this.startLoading();

      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');

      var fileName = fileNames[0];
      console.log("Reading GPX file:", fileName);

      globalNode.fs.readFile(fileName, 'utf-8', function (err, data) {
        try {
          _this.io.importGPX(data);
        } catch (error) {
          console.error(error);
        }
      });
    });
  }

  printRoadbook() {
    if (this.canExport()) {
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      this.ipc.send('ignite-print', app.roadbook.statelessJSON(), this.settings);
    } else {
      globalNode.dialog().showMessageBoxSync({
        message: "You must save your roadbook before you can save it as PDF.",
        type: 'info',
        buttons: ['OK']
      });
    }
  }

  saveRoadBook() {
    try {
      if (this.roadbook.filePath == null) {
        this.saveRoadBookAs();
      } else {
        this.roadbook.finishInstructionEdit();
        var tulipFile = this.roadbook.statefulJSON();
        delete tulipFile.filePath;
        this.fs.writeFile(this.roadbook.filePath, JSON.stringify(tulipFile, null, 2), function (err) { });
        this.roadbookController.isSaved(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  saveRoadBookAs() {
    var filePath;
    if (this.roadbook.filePath == null) {
      filePath = this.documentPath + '/'
        + (this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : this.roadbook.name().replace(/\s/g, '-'))
        + ".tlp"
    } else {
      filePath = this.roadbook.filePath
    }
    this.showSaveDialog('Save roadbook as', filePath)
  }

  showSaveDialog(title, path) {
    var _this = this;

    globalNode.dialog().showSaveDialog({
      title: title,
      defaultPath: path,
      filters: [{ name: 'tulip', extensions: ['tlp'] }]
    }).then(dialogInfo => {
      var fileName = dialogInfo.filePath;

      if (dialogInfo.canceled)
        return;

      // assign the file path to the json for first time players
      // TODO figure out what to do if the user changes the name of the file
      var tulipFile = _this.roadbook.statefulJSON();
      delete tulipFile.filePath;
      _this.roadbook.filePath = fileName;
      tulipFile = JSON.stringify(tulipFile, null, 2);

      _this.fs.writeFile(fileName, tulipFile, function (err) { });

      console.log("Saved roadbook to ", fileName);

      localStorage.setItem('lastRoadBook', fileName);
      this.updateWindowTitle(fileName);
      this.roadbookController.isSaved(true);
      this.ipc.send('save-recent-filename', fileName);
      return true;
    });
  }

  startLoading() {
    $('#loading').show();
    google.maps.event.addListener(this.mapController.map, 'idle', this.stopLoading); //TODO pass to map controller with callback
  }

  stopLoading() {
    $('#loading').hide();
  }

  initMap() {
    this.mapModel = new MapModel();
    this.mapController = new MapController(this.mapModel, this.settings.homeView, !this.settings.loadLastRoadbook);
    this.mapController.placeMapAttribution();
    if (this.settings.loadLastRoadbook) {
      this.openLastRoadBook();
    }
  }

  toggleRoadbook() {
    $('.roadbook-container').toggleClass('collapsed');
    $('.roadbook-container').toggleClass('expanded');

    $('#toggle-roadbook i').toggleClass('fi-arrow-down');
    $('#toggle-roadbook i').toggleClass('fi-arrow-up');
  }

  showRoadbook() {
    $('.roadbook-container').removeClass('collapsed');
    $('.roadbook-container').addClass('expanded');

    $('#toggle-roadbook i').removeClass('fi-arrow-down');
    $('#toggle-roadbook i').addClass('fi-arrow-up');
  }

  newRoadbook() {
    this.roadbook.newRoadbook();
    while (true) {
      try {
        app.mapModel.deletePointFromRoute(0);
        app.mapModel.deleteInstructionFromRoadbook(0);
      }
      catch (error) {
        break;
      }
    }
  }

  setHomeView() {
    const center = this.mapController.getMapCenter()
    this.settings.homeView = {
      lat: center.lat(),
      lon: center.lng(),
      zoom: this.mapController.getMapZoom()
    }
  }
  saveSettings() {
    const settings = this.settings;
    settings.loadLastRoadbook = $('#open_last').prop('checked');
    settings.gmapKey = $('#gmap_key').val();
    settings.googleDirectionsKey = $('#google_directions_key').val();
    settings.openDevConsole = $('#open_dev_console').prop('checked');
    try {
      settings.tulipNearDistance = parseInt($('#tulip_near_distance').val());
    } catch (ex) {
      console.log(ex);
      settings.tulipNearDistance = 300;
    }
    settings.showCapHeading = $('#show_cap_heading').prop('checked');
    settings.showCoordinates = $('#show_coordinates').prop('checked');
    settings.coordinatesFormat = $('#coordinates_format').find(":selected").val();
    settings.showChangelogOnStart = this.settings.showChangelogOnStart ?? { 'version': this.version };
    settings.openRallyStrict = $('#openrally_strict').prop('checked');


    localStorage.setItem('settings', JSON.stringify(settings));
    app.settings = settings;
    $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
    this.refreshInstructionElements();
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') ?? "{}");
    if (settings.openRallyStrict === undefined) {
      settings.openRallyStrict = false;
    }
    $('#open_last').prop('checked', settings.loadLastRoadbook ?? false);
    $('#gmap_key').val(settings.gmapKey ?? '');
    $('#google_directions_key').val(settings.googleDirectionsKey ?? '');
    $('#open_dev_console').prop('checked', settings.openDevConsole ?? false);
    $('#tulip_near_distance').val(settings.tulipNearDistance ?? 300);
    $('#show_cap_heading').prop('checked', settings.showCapHeading ?? false);
    $('#show_coordinates').prop('checked', settings.showCoordinates ?? false);
    $('#coordinates_format').val(settings.coordinatesFormat ?? 'ddmmss');
    $('#openrally_strict').prop('checked', settings.openRallyStrict);
    $('#user_glyph_path_text').text(settings.user_glyph_path ?? "No path selected");

    if (settings.openDevConsole) {
      this.ipc.send('open-dev-tools');
    }
    if (settings.showChangelogOnStart === undefined ||
      (settings.showChangelogOnStart.showOnStart || (settings.showChangelogOnStart.version != this.version))) {
      this.ipc.send('open-changelog');
    }
    if (!settings.homeView) {
      settings.homeView = null;
    }
    return settings;
  }

  initializeGoogleMaps() {
    const proxyUrl = "https://datasets.stadar.org/maps/api/js?libraries=geometry&callback=app.initMap&loading=async";
    if (this.settings.gmapKey) {
      const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${this.settings.gmapKey}&libraries=geometry&callback=app.initMap&loading=async`;
      console.log("Using Google Maps key from settings.");
      this.loadGoogleMaps(mapsUrl);
    } else {
      console.log("No Google Maps key found. Checking proxy...");
      this.checkProxyAvailability(proxyUrl).then((proxyAvailable) => {
        if (proxyAvailable) {
          console.log("Proxy is available. Using it.");
          this.loadGoogleMaps(proxyUrl);
        } else {
          console.log("No API key and proxy is unavailable.");
          globalNode.dialog().showMessageBoxSync({
            message: "You must set your Google Maps key in settings and restart the app.",
            type: 'info',
            buttons: ['OK']
          });
          $('.off-canvas-wrap').foundation('offcanvas', 'show', 'move-left');
        }
      });
    }
  }

  loadGoogleMaps(mapsUrl) {
    const script = document.createElement("script");
    script.src = mapsUrl;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  async checkProxyAvailability(proxyUrl) {
    return fetch(proxyUrl, { method: "GET" }) // Quick check if proxy responds
      .then((response) => response.ok)
      .catch(() => false);
  }

  refreshInstructionElements() {

  }

  updateWindowTitle(filename = '') {
    if (filename != '')
      filename = " - " + filename;
    document.title = "Tulip " + this.version + filename;
  }
  /*
    ---------------------------------------------------------------------------
    Roadbook Listeners
    ---------------------------------------------------------------------------
  */
  initListeners() {

    var _this = this

    $('#toggle-roadbook').on("click", function () {
      _this.toggleRoadbook();
      $(this).blur();
    });

    $('#save-roadbook').on('click', function (e) {
      e.preventDefault();
      if (_this.canSave()) {
        if (e.shiftKey) {
          _this.saveRoadBookAs();
        } else {
          _this.saveRoadBook();
        }
      }
      $(this).blur();
    });

    $('#user_glyph_path_select').on('click', function () {
      _this.openUserGlyphFolder();
    })

    $('#set-current-view-as-home').on('click', function () {
      _this.setHomeView();
      _this.saveSettings();
    });

    $('#save-settings').on('click', function () {
      _this.saveSettings();
    });

    $('[name="toggle-insert-type"]').on('change', function (e) {
      if (e.target.id == 'toggle-insert-track') {
        $('.track-selection').removeClass('hidden');
        $('#track-selection-grid').show();
        $('#glyph-selection-grid').hide();
        $('#text-selection-grid').hide();
      }
      else if (e.target.id == 'toggle-insert-glyph') {
        $('.track-selection').addClass('hidden');
        $('#track-selection-grid').hide();
        $('#glyph-selection-grid').show();
        $('#text-selection-grid').hide();
      } else if (e.target.id == 'toggle-insert-text') {
        $('.track-selection').addClass('hidden');
        $('#track-selection-grid').hide();
        $('#glyph-selection-grid').hide();
        $('#text-selection-grid').show();
      }
    });

    $('#roadbook-logo-remove').on('click', function () {
      _this.roadbook.customLogo(null);
    })

    /*
      We're adding IPC listeners in here I guess eh?

      This super duper needs to be cleaned up
    */
    // Listener to get path to documents directory from node for saving roadbooks
    // NOTE only use this for roadbooks which haven't been named
    this.ipc.on('documents-path', function (event, arg) {
      _this.documentPath = arg;
    });

    this.ipc.on('save-roadbook', function (event, arg) {
      _this.saveRoadBook();
    });

    this.ipc.on('save-roadbook-as', function (event, arg) {
      _this.saveRoadBookAs();
    });

    this.ipc.on('open-roadbook', function (event, arg) {
      _this.openRoadBook();
    });

    this.ipc.on('load-roadbook', function (event, fileName) {
      _this.loadRoadBook(fileName);
    });

    this.ipc.on('append-roadbook', function (event, arg) {
      _this.openRoadBook(true);
    });

    this.ipc.on('reload-roadbook', function (event, arg) {
      location.reload();
    });

    this.ipc.on('toggle-roadbook', function (event, arg) {
      _this.toggleRoadbook();
    });

    this.ipc.on('import-gpx', function (event, arg) {
      _this.importGPX();
    });

    this.ipc.on('export-gpx', function (event, arg) {
      _this.exportGPX();
    });

    this.ipc.on('export-openrally-gpx', function (event, arg) {
      _this.exportOpenRallyGPX();
    });

    this.ipc.on('export-pdf', function (event, arg) {
      _this.printRoadbook();
    });

    this.ipc.on('zoom-in', function (event, arg) {
      _this.mapController.zin();
    });

    this.ipc.on('zoom-out', function (event, arg) {
      _this.mapController.zout();
    });
    this.ipc.on('add-glyph', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.glyphControls.showGlyphModal(30, 30);
      }
    });

    this.ipc.on('add-track-0', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(0);
      }
    });

    this.ipc.on('add-track-45', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(45);
      }
    });

    this.ipc.on('add-track-90', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(90);
      }
    });

    this.ipc.on('add-track-135', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(135);
      }
    });

    this.ipc.on('add-track-180', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(180);
      }
    });

    this.ipc.on('add-track-225', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(225);
      }
    });

    this.ipc.on('add-track-270', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(270);
      }
    });

    this.ipc.on('add-track-315', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(315);
      }
    });

    this.ipc.on('set-track-lvt', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('lowVisTrack');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[0]).addClass('active');
      }
    });

    this.ipc.on('set-track-hp', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('offPiste');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[0]).addClass('active');
      }
    });

    this.ipc.on('set-track-p', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('smallTrack');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[1]).addClass('active');
      }
    });

    this.ipc.on('set-track-pp', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('track');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[2]).addClass('active');
      }
    });

    this.ipc.on('set-track-ro', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('tarmacRoad');
        $('.added-track-selector').removeClass('active');
        console.log($('.added-track-selector')[3]);
        $($('.added-track-selector')[3]).addClass('active');
      }
    });

    this.ipc.on('set-track-dcw', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('dcw');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[4]).addClass('active');
      }
    });

    this.ipc.on('new-roadbook', function (event, arg) {
      var nr = window.confirm("Start a new roadbook? Unsaved changes will be lost");
      if (nr) {
        _this.updateWindowTitle();
        _this.newRoadbook();
      }
    });

    this.ipc.on('open-settings', function (event, arg) {
      $('.off-canvas-wrap').foundation('offcanvas', 'show', 'move-left');
    })

    this.ipc.on('show-about-info', function (event, arg) {
      $('#about').foundation('reveal', 'open');
    });

    window.addEventListener("beforeunload", function (event) {
      if (_this.roadbook.filePath) {
        var rb = JSON.stringify(this.roadbook.statefulJSON(), null, 2);
        var save = _this.dialog.showMessageBox({ message: "Would you like to save before closing? All unsaved changes will be lost.", buttons: ['ok', 'nope'], type: 'question' });
        if (save == 0) {
          _this.fs.writeFile(_this.roadbook.filePath, rb, function (err) { });
        }
      }
    });

    this.ipc.on('changelog-result', (event, result) => {
      var setting = result || {
        'showOnStart': this.settings?.showChangelogOnStart?.showOnStart ?? true
      };
      setting['version'] = this.version;
      this.settings.showChangelogOnStart = setting;
      this.saveSettings();
    });

    this.ipc.on('open-changelog', (event, result) => {
      this.ipc.send('open-changelog');
    });

    this.ipc.on('add-roadbook-logo', function (event, arg) {
      _this.openRoadBookLogo();
    });

    this.ipc.on('send-to-back', function (event, arg) {
      app.roadbook.currentlyEditingInstruction.tulip.sendBackwardActiveGlyph();
    });

    this.ipc.on('bring-to-front', function (event, arg) {
      app.roadbook.currentlyEditingInstruction.tulip.bringForwardActiveGlyph();
    });

    this.ipc.on('fill-zone-speed-limit', function (event, arg) {
      app.roadbook.fillZoneSpeedLimit();
    });

    this.ipc.on('user-glyphs', (event, result) => {
      _this.userGlyphs = result;
      _this.glyphControls.updateUserGlyphs(result);
    });
  }
};
