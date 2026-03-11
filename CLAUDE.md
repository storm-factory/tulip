# Tulip Modernization Refactor Plan

## Executive Summary

This document outlines the modernization strategy for the Tulip roadbook application, a desktop Electron app for creating rally navigation documents. The app is currently built on Electron 1.2.0 (2016) with jQuery, Knockout.js, and Foundation CSS.

## Current State Assessment

### Technology Stack
- **Electron**: 1.2.0 (2016) - *9 years outdated*
- **jQuery**: 2.1.4 (2015) - ~266 jQuery calls throughout app
- **Knockout.js**: 3.4.0 - MVVM data binding
- **Foundation**: 5.5.3 - CSS framework
- **Fabric.js**: Canvas manipulation for tulip diagrams
- **Google Maps API**: Map integration
- **Custom Code**: ~4,000 lines across 17 files

### Current Architecture

```
Application (Global singleton)
 └─ Modules:
     └─ Mapping
         └─ Roadbook
             └─ Waypoint
                 └─ Tulip
                     └─ TrackEditor
```

### Identified Problems

1. **Global State Everywhere**
   - `app = new App()` is a global variable accessed from anywhere
   - Hidden dependencies make testing difficult
   - Tight coupling across modules

2. **Mixed Concerns**
   - `Application.js` has 500+ lines mixing UI, I/O, business logic
   - Hard to test individual components
   - Changes have ripple effects

3. **Outdated Electron APIs**
   - Uses deprecated `require('electron').remote`
   - Security model is from 2016
   - Missing modern Electron features

4. **jQuery Dependency**
   - 80kb+ library for DOM manipulation
   - Not needed in modern Electron (ships with Chromium)
   - Verbose compared to vanilla JS

---

## Modernization Options Evaluated

### Option 1: Full React Rewrite ❌
**Effort**: 2-3 months
**Risk**: High
**Verdict**: Too disruptive, essentially a complete rewrite

### Option 2: Alpine.js Migration ⚠️
**Effort**: 3-4 weeks
**Risk**: Low
**Verdict**: Good option but still requires learning new framework

### Option 3: Vanilla JS Migration ✅ **RECOMMENDED**
**Effort**: 2-3 weeks (incremental)
**Risk**: Very Low
**Verdict**: Best fit for Electron - no cross-browser concerns, modern APIs available

### Option 4: Modernize Build Tools Only
**Effort**: 1-2 weeks
**Risk**: Very Low
**Verdict**: Good first step, but doesn't address architecture issues

---

## Recommended Approach: Service-Oriented Architecture

### Why This Pattern?

✅ **Electron-friendly**: Services handle platform APIs cleanly
✅ **Testable**: Each layer can be tested independently
✅ **Maintainable**: Clear separation of concerns
✅ **Scalable**: Easy to add new features
✅ **Migration-friendly**: Can refactor incrementally
✅ **Framework-agnostic**: Works with vanilla JS now, React later if needed

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Application                          │
│              (Bootstrap & Coordination)                 │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SERVICES   │  │    DOMAIN    │  │      UI      │
│              │  │    MODELS    │  │  CONTROLLERS │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
┌───────┴────────┐  ┌──────┴──────┐  ┌───────┴────────┐
│ FileService    │  │ Roadbook    │  │ MapController  │
│ DialogService  │  │ Waypoint    │  │ UIController   │
│ ExportService  │  │ Tulip       │  │ PaletteCtrl    │
│ MapService     │  │ Track       │  │                │
│ IPCService     │  │ Glyph       │  │                │
└────────────────┘  └─────────────┘  └────────────────┘
```

---

## Detailed Design

### 1. Services Layer (Infrastructure & I/O)

**Responsibility**: Handle all external interactions - file system, dialogs, IPC, APIs

```javascript
// services/FileService.js
class FileService {
  constructor(electron) {
    this.dialog = electron.remote.dialog;
    this.fs = require('fs').promises;
  }

  async openFile(filters) {
    const result = await this.dialog.showOpenDialog({ filters });
    if (!result.canceled) {
      return await this.fs.readFile(result.filePaths[0], 'utf-8');
    }
    return null;
  }

  async saveFile(path, content) {
    return await this.fs.writeFile(path, content, 'utf-8');
  }

  async saveFileAs(defaultPath, filters) {
    const result = await this.dialog.showSaveDialog({
      defaultPath,
      filters
    });

    if (!result.canceled) {
      return result.filePath;
    }
    return null;
  }
}

// services/ExportService.js
class ExportService {
  constructor(fileService) {
    this.fileService = fileService;
  }

  async exportGPX(roadbook, outputPath) {
    const gpxContent = this.convertToGPX(roadbook);
    await this.fileService.saveFile(outputPath, gpxContent);
  }

  async exportOpenRallyGPX(roadbook, outputPath) {
    const gpxContent = this.convertToOpenRallyGPX(roadbook);
    await this.fileService.saveFile(outputPath, gpxContent);
  }

  convertToGPX(roadbook) {
    // Pure conversion logic - no I/O
    const waypoints = roadbook.waypoints.map(wp =>
      `<wpt lat="${wp.lat}" lon="${wp.lng}">
        <name>${wp.note || 'Waypoint'}</name>
      </wpt>`
    ).join('\n');

    return `<?xml version="1.0"?>
      <gpx version="1.1">
        ${waypoints}
      </gpx>`;
  }

  convertToOpenRallyGPX(roadbook) {
    // OpenRally-specific format
  }
}

// services/MapService.js
class MapService {
  constructor(googleMapsAPI) {
    this.api = googleMapsAPI;
    this.map = null;
    this.markers = [];
  }

  createMap(element, options) {
    this.map = new this.api.Map(element, options);
    return this.map;
  }

  addMarker(position, options = {}) {
    const marker = new this.api.Marker({
      position,
      map: this.map,
      ...options
    });
    this.markers.push(marker);
    return marker;
  }

  clearMarkers() {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
  }
}

// services/DialogService.js
class DialogService {
  constructor(electron) {
    this.dialog = electron.remote.dialog;
  }

  showError(message) {
    return this.dialog.showMessageBox({
      type: 'error',
      message,
      buttons: ['OK']
    });
  }

  showSuccess(message) {
    return this.dialog.showMessageBox({
      type: 'info',
      message,
      buttons: ['OK']
    });
  }

  confirm(message) {
    return this.dialog.showMessageBox({
      type: 'question',
      message,
      buttons: ['Yes', 'No']
    }).then(result => result.response === 0);
  }
}

// services/IPCService.js
class IPCService {
  constructor(ipcRenderer) {
    this.ipc = ipcRenderer;
    this.handlers = new Map();
  }

  on(channel, handler) {
    this.ipc.on(channel, handler);
    this.handlers.set(channel, handler);
  }

  send(channel, data) {
    this.ipc.send(channel, data);
  }

  removeAllListeners() {
    this.handlers.forEach((handler, channel) => {
      this.ipc.removeListener(channel, handler);
    });
    this.handlers.clear();
  }
}
```

**Benefits:**
- ✅ All Electron APIs isolated to service layer
- ✅ Easy to mock for testing
- ✅ Reusable across features
- ✅ Single place to update when Electron APIs change

---

### 2. Domain Models (Business Logic)

**Responsibility**: Pure business logic - no DOM, no I/O, just data and calculations

```javascript
// models/Roadbook.js
class Roadbook {
  constructor() {
    this.name = 'Untitled Roadbook';
    this.description = '';
    this.waypoints = [];
    this.filePath = null;
    this.editingNameDesc = false;
    this.currentlyEditingWaypoint = null;
  }

  addWaypoint(waypoint) {
    this.waypoints.push(waypoint);
    this.recalculateDistances();
    return waypoint;
  }

  removeWaypoint(index) {
    const removed = this.waypoints.splice(index, 1);
    this.recalculateDistances();
    return removed[0];
  }

  recalculateDistances() {
    let totalDistance = 0;

    this.waypoints.forEach((wp, i) => {
      if (i > 0) {
        const prev = this.waypoints[i - 1];
        wp.distFromPrev = this.calculateDistance(prev, wp);
      } else {
        wp.distFromPrev = 0;
      }
      totalDistance += wp.distFromPrev;
      wp.totalDistance = totalDistance;
    });
  }

  calculateDistance(wp1, wp2) {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(wp2.lat - wp1.lat);
    const dLon = this.toRad(wp2.lng - wp1.lng);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(wp1.lat)) * Math.cos(this.toRad(wp2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  get totalDistance() {
    return this.waypoints.length > 0
      ? this.waypoints[this.waypoints.length - 1].totalDistance
      : 0;
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      waypoints: this.waypoints.map(wp => wp.toJSON()),
      filePath: this.filePath
    };
  }

  static fromJSON(data) {
    const roadbook = new Roadbook();
    roadbook.name = data.name;
    roadbook.description = data.description;
    roadbook.filePath = data.filePath;
    roadbook.waypoints = data.waypoints.map(Waypoint.fromJSON);
    roadbook.recalculateDistances();
    return roadbook;
  }
}

// models/Waypoint.js
class Waypoint {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
    this.tulip = new Tulip();
    this.note = '';
    this.noteHTML = '';
    this.heading = 0;
    this.showHeading = false;
    this.distFromPrev = 0;
    this.totalDistance = 0;
    this.bubble = 100; // RallyComp bubble radius
    this.modifier = 0;  // RallyComp modifier
  }

  setNote(text) {
    this.note = text;
  }

  setNoteHTML(html) {
    this.noteHTML = html;
  }

  calculateHeading(prevWaypoint) {
    if (!prevWaypoint) return 0;

    const dLon = this.lng - prevWaypoint.lng;
    const y = Math.sin(dLon) * Math.cos(this.lat);
    const x = Math.cos(prevWaypoint.lat) * Math.sin(this.lat) -
              Math.sin(prevWaypoint.lat) * Math.cos(this.lat) * Math.cos(dLon);

    let heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  }

  toJSON() {
    return {
      lat: this.lat,
      lng: this.lng,
      tulip: this.tulip.toJSON(),
      note: this.note,
      noteHTML: this.noteHTML,
      heading: this.heading,
      showHeading: this.showHeading,
      bubble: this.bubble,
      modifier: this.modifier
    };
  }

  static fromJSON(data) {
    const wp = new Waypoint(data.lat, data.lng);
    wp.tulip = Tulip.fromJSON(data.tulip);
    wp.note = data.note;
    wp.noteHTML = data.noteHTML;
    wp.heading = data.heading;
    wp.showHeading = data.showHeading;
    wp.bubble = data.bubble || 100;
    wp.modifier = data.modifier || 0;
    return wp;
  }
}

// models/Tulip.js
class Tulip {
  constructor() {
    this.tracks = [];
    this.glyphs = [];
    this.entryTrackType = 'track';
    this.exitTrackType = 'track';
    this.addedTrackType = 'track';
  }

  addTrack(angle) {
    this.tracks.push({
      angle,
      type: this.addedTrackType
    });
  }

  removeLastTrack() {
    return this.tracks.pop();
  }

  addGlyph(glyph, position) {
    this.glyphs.push({
      glyph,
      top: position.top,
      left: position.left
    });
  }

  toJSON() {
    return {
      tracks: this.tracks,
      glyphs: this.glyphs,
      entryTrackType: this.entryTrackType,
      exitTrackType: this.exitTrackType,
      addedTrackType: this.addedTrackType
    };
  }

  static fromJSON(data) {
    const tulip = new Tulip();
    tulip.tracks = data.tracks || [];
    tulip.glyphs = data.glyphs || [];
    tulip.entryTrackType = data.entryTrackType || 'track';
    tulip.exitTrackType = data.exitTrackType || 'track';
    tulip.addedTrackType = data.addedTrackType || 'track';
    return tulip;
  }
}
```

**Benefits:**
- ✅ Testable without DOM or Electron
- ✅ Clear business rules in one place
- ✅ Easy to understand and modify
- ✅ No external dependencies

---

### 3. Controllers (Coordination Layer)

**Responsibility**: Coordinate between UI, Services, and Models

```javascript
// controllers/RoadbookController.js
class RoadbookController {
  constructor(roadbook, fileService, exportService, dialogService, eventBus) {
    this.roadbook = roadbook;
    this.fileService = fileService;
    this.exportService = exportService;
    this.dialogService = dialogService;
    this.eventBus = eventBus;
  }

  async openRoadbook() {
    try {
      const content = await this.fileService.openFile([
        { name: 'tulip', extensions: ['tlp'] }
      ]);

      if (content) {
        const data = JSON.parse(content);
        this.roadbook = Roadbook.fromJSON(data);
        this.eventBus.emit('roadbook:loaded', this.roadbook);
      }
    } catch (error) {
      await this.dialogService.showError('Failed to open roadbook: ' + error.message);
    }
  }

  async saveRoadbook() {
    if (!this.roadbook.filePath) {
      return this.saveRoadbookAs();
    }

    try {
      const content = JSON.stringify(this.roadbook.toJSON(), null, 2);
      await this.fileService.saveFile(this.roadbook.filePath, content);
      this.eventBus.emit('roadbook:saved', this.roadbook);
    } catch (error) {
      await this.dialogService.showError('Failed to save: ' + error.message);
    }
  }

  async saveRoadbookAs() {
    const defaultPath = this.roadbook.filePath ||
                        `${this.roadbook.name.replace(/\s/g, '-')}.tlp`;

    const filePath = await this.fileService.saveFileAs(defaultPath, [
      { name: 'tulip', extensions: ['tlp'] }
    ]);

    if (filePath) {
      this.roadbook.filePath = filePath;
      return this.saveRoadbook();
    }
  }

  async exportGPX() {
    if (!this.roadbook.filePath) {
      await this.dialogService.showError('Save roadbook first');
      return;
    }

    try {
      const gpxPath = this.roadbook.filePath.replace('.tlp', '.gpx');
      await this.exportService.exportGPX(this.roadbook, gpxPath);
      await this.dialogService.showSuccess('GPX exported successfully!');
    } catch (error) {
      await this.dialogService.showError('Export failed: ' + error.message);
    }
  }

  async exportOpenRallyGPX() {
    if (!this.roadbook.filePath) {
      await this.dialogService.showError('Save roadbook first');
      return;
    }

    try {
      const gpxPath = this.roadbook.filePath.replace('.tlp', '-openrally.gpx');
      await this.exportService.exportOpenRallyGPX(this.roadbook, gpxPath);
      await this.dialogService.showSuccess('OpenRally GPX exported!');
    } catch (error) {
      await this.dialogService.showError('Export failed: ' + error.message);
    }
  }

  addWaypoint(lat, lng) {
    const waypoint = new Waypoint(lat, lng);
    this.roadbook.addWaypoint(waypoint);
    this.eventBus.emit('waypoint:added', waypoint);
    return waypoint;
  }

  removeWaypoint(index) {
    const waypoint = this.roadbook.removeWaypoint(index);
    this.eventBus.emit('waypoint:removed', { waypoint, index });
    return waypoint;
  }

  editWaypoint(waypoint) {
    this.roadbook.currentlyEditingWaypoint = waypoint;
    this.eventBus.emit('waypoint:editing', waypoint);
  }

  finishEditingWaypoint() {
    const waypoint = this.roadbook.currentlyEditingWaypoint;
    this.roadbook.currentlyEditingWaypoint = null;
    this.eventBus.emit('waypoint:editFinished', waypoint);
  }
}

// controllers/MapController.js
class MapController {
  constructor(mapService, roadbookController, eventBus) {
    this.mapService = mapService;
    this.roadbookController = roadbookController;
    this.eventBus = eventBus;
    this.waypointMarkers = new Map();

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('waypoint:added', (waypoint) => {
      this.addWaypointMarker(waypoint);
    });

    this.eventBus.on('waypoint:removed', ({ waypoint, index }) => {
      this.removeWaypointMarker(waypoint);
    });
  }

  initializeMap(element) {
    this.map = this.mapService.createMap(element, {
      zoom: 8,
      center: { lat: 0, lng: 0 }
    });

    // Listen for map clicks
    this.map.addListener('click', (event) => {
      this.onMapClick(event.latLng);
    });
  }

  onMapClick(latLng) {
    const waypoint = this.roadbookController.addWaypoint(
      latLng.lat(),
      latLng.lng()
    );
  }

  addWaypointMarker(waypoint) {
    const marker = this.mapService.addMarker(
      { lat: waypoint.lat, lng: waypoint.lng },
      { draggable: true }
    );

    marker.addListener('click', () => {
      this.roadbookController.editWaypoint(waypoint);
    });

    this.waypointMarkers.set(waypoint, marker);
  }

  removeWaypointMarker(waypoint) {
    const marker = this.waypointMarkers.get(waypoint);
    if (marker) {
      marker.setMap(null);
      this.waypointMarkers.delete(waypoint);
    }
  }
}

// controllers/UIController.js
class UIController {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('roadbook:loaded', (roadbook) => {
      this.renderRoadbook(roadbook);
    });

    this.eventBus.on('roadbook:saved', () => {
      this.showSaveIndicator();
    });

    this.eventBus.on('waypoint:added', (waypoint) => {
      this.renderWaypoint(waypoint);
    });

    this.eventBus.on('waypoint:editing', (waypoint) => {
      this.showWaypointPalette(waypoint);
    });

    this.eventBus.on('waypoint:editFinished', () => {
      this.hideWaypointPalette();
    });
  }

  renderRoadbook(roadbook) {
    // Update UI elements
    document.querySelector('#roadbook-name p').textContent = roadbook.name;
    document.querySelector('#roadbook-desc p').innerHTML = roadbook.description;
    document.querySelector('#roadbook-total-distance p').textContent =
      roadbook.totalDistance.toFixed(2) + ' km';

    // Render all waypoints
    const container = document.querySelector('#roadbook-waypoints');
    container.innerHTML = '';
    roadbook.waypoints.forEach(wp => this.renderWaypoint(wp));
  }

  renderWaypoint(waypoint) {
    const template = document.querySelector('#waypoint-template');
    const clone = template.content.cloneNode(true);

    // Populate template with waypoint data
    clone.querySelector('.total-distance').textContent =
      waypoint.totalDistance.toFixed(2);
    clone.querySelector('.relative-distance').textContent =
      waypoint.distFromPrev.toFixed(2);
    clone.querySelector('.waypoint-note').innerHTML = waypoint.noteHTML;

    // Render tulip canvas
    const canvas = clone.querySelector('canvas');
    this.renderTulip(canvas, waypoint.tulip);

    document.querySelector('#roadbook-waypoints').appendChild(clone);
  }

  renderTulip(canvas, tulip) {
    // Use Fabric.js to render tulip
    const fabricCanvas = new fabric.Canvas(canvas);
    // ... render tracks and glyphs
  }

  showWaypointPalette(waypoint) {
    const palette = document.querySelector('#waypoint-palette');
    palette.style.display = 'block';
    // Populate palette controls for this waypoint
  }

  hideWaypointPalette() {
    const palette = document.querySelector('#waypoint-palette');
    palette.style.display = 'none';
  }

  showSaveIndicator() {
    const saveBtn = document.querySelector('#save-roadbook');
    saveBtn.classList.add('secondary');
  }
}
```

**Benefits:**
- ✅ Clear orchestration of complex workflows
- ✅ Error handling at appropriate level
- ✅ No business logic (delegates to models)
- ✅ No I/O (delegates to services)

---

### 4. Event Bus (Decoupling)

**Responsibility**: Decouple components through events

```javascript
// core/EventBus.js
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  clear() {
    this.listeners.clear();
  }
}
```

**Standard Events:**
- `roadbook:loaded` - Roadbook opened from file
- `roadbook:saved` - Roadbook saved successfully
- `roadbook:modified` - Any change to roadbook
- `waypoint:added` - New waypoint created
- `waypoint:removed` - Waypoint deleted
- `waypoint:editing` - User started editing waypoint
- `waypoint:editFinished` - User finished editing
- `waypoint:modified` - Waypoint data changed
- `map:clicked` - User clicked on map
- `export:started` - Export process started
- `export:completed` - Export finished
- `error:occurred` - Any error happened

---

### 5. Application Bootstrap

**Responsibility**: Wire everything together

```javascript
// main.js
class Application {
  constructor() {
    this.eventBus = new EventBus();
    this.initServices();
    this.initModels();
    this.initControllers();
    this.initUI();
    this.initIPC();
  }

  initServices() {
    const electron = require('electron');

    this.services = {
      file: new FileService(electron),
      export: new ExportService(),
      map: new MapService(google.maps),
      dialog: new DialogService(electron),
      ipc: new IPCService(electron.ipcRenderer)
    };
  }

  initModels() {
    this.roadbook = new Roadbook();
  }

  initControllers() {
    this.controllers = {
      roadbook: new RoadbookController(
        this.roadbook,
        this.services.file,
        this.services.export,
        this.services.dialog,
        this.eventBus
      ),
      map: new MapController(
        this.services.map,
        null, // Will be set after roadbook controller exists
        this.eventBus
      ),
      ui: new UIController(this.eventBus)
    };

    // Set roadbook controller reference
    this.controllers.map.roadbookController = this.controllers.roadbook;
  }

  initUI() {
    // Initialize map
    this.controllers.map.initializeMap(
      document.querySelector('#map')
    );

    // Attach DOM event handlers
    this.attachEventHandlers();
  }

  attachEventHandlers() {
    // File menu
    document.querySelector('#open-roadbook').addEventListener('click', () => {
      this.controllers.roadbook.openRoadbook();
    });

    document.querySelector('#save-roadbook').addEventListener('click', (e) => {
      if (e.shiftKey) {
        this.controllers.roadbook.saveRoadbookAs();
      } else {
        this.controllers.roadbook.saveRoadbook();
      }
    });

    document.querySelector('#export-gpx').addEventListener('click', () => {
      this.controllers.roadbook.exportGPX();
    });

    document.querySelector('#export-openrally-gpx').addEventListener('click', () => {
      this.controllers.roadbook.exportOpenRallyGPX();
    });

    // Toggle roadbook panel
    document.querySelector('#toggle-roadbook').addEventListener('click', () => {
      document.querySelector('.roadbook-container').classList.toggle('collapsed');
      document.querySelector('.roadbook-container').classList.toggle('expanded');
    });

    // ... more event handlers
  }

  initIPC() {
    // Listen for IPC messages from main process
    this.services.ipc.on('save-roadbook', () => {
      this.controllers.roadbook.saveRoadbook();
    });

    this.services.ipc.on('save-roadbook-as', () => {
      this.controllers.roadbook.saveRoadbookAs();
    });

    this.services.ipc.on('open-roadbook', () => {
      this.controllers.roadbook.openRoadbook();
    });

    this.services.ipc.on('export-gpx', () => {
      this.controllers.roadbook.exportGPX();
    });

    // ... more IPC handlers
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new Application();
});
```

---

## Migration Strategy

### ⚠️ Revised Phase Order

**Original Order**: Phases 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

**Revised Order** (Practical Implementation):
- ✅ **Phase 1**: Electron Upgrade - *COMPLETED*
- ✅ **Phase 2**: Extract Services - *COMPLETED*
- ✅ **Phase 4**: Create Controllers - *COMPLETED*
- ✅ **Phase 5**: Add EventBus - *COMPLETED*
- **Phase 6**: Remove jQuery/Knockout
- **Phase 3**: Refine Domain Models *(Deferred - depends on Phase 6)*
- **Phase 7**: Modernize CSS
- **Phase 8**: Add Build Tooling
- ✅ **Phase 9**: Settings UI - *COMPLETED*
- **Phase 10**: Help UI

**Why the change?**
After analyzing the codebase, Phase 3 (Refine Domain Models) is heavily dependent on Phase 6 (Remove jQuery/Knockout) because the current models are tightly coupled with Knockout.js observables and jQuery DOM manipulation. Attempting to refactor models while keeping Knockout would require rewriting everything twice. It's more pragmatic to:
1. Build the controller layer (Phase 4)
2. Add EventBus for decoupling (Phase 5)
3. Remove jQuery/Knockout together (Phase 6)
4. Then refactor models to be pure (Phase 3)

This revised order is **more incremental** and **avoids duplicate work**.

---

### Phase 1: Electron Upgrade (Week 1-2) ✅ **COMPLETED**

**Goal**: Update to Electron 33+ and fix breaking changes

**Tasks:**
1. Update `package.json`:
   ```json
   {
     "devDependencies": {
       "electron": "^33.0.0"
     }
   }
   ```

2. Fix deprecated APIs in `main.js`:
   ```javascript
   // OLD
   mainWindow.loadURL('file://' + __dirname + '/index.html')

   // NEW
   mainWindow.loadFile('index.html')
   ```

3. Update BrowserWindow security:
   ```javascript
   mainWindow = new BrowserWindow({
     width: 1500,
     height: 1000,
     webPreferences: {
       nodeIntegration: true,
       contextIsolation: false  // For now, fix later
     }
   });
   ```

4. Replace `electron.remote` usage:
   ```javascript
   // In renderer (index.html)
   // OLD
   const { dialog } = require('electron').remote;

   // NEW - use IPC instead
   ipcRenderer.invoke('show-open-dialog', options);
   ```

5. Test all features:
   - [ ] File open/save
   - [ ] GPX import/export
   - [ ] PDF export
   - [ ] All menu shortcuts
   - [ ] Map interaction

**Success Criteria**: App runs on Electron 33+ with all features working

---

### Phase 2: Extract Services (Week 3) ✅ **COMPLETED**

**Goal**: Create service layer and move all I/O out of Application.js

**Tasks:**
1. ✅ Create `services/` directory
2. ✅ Implement `FileService` - file I/O and dialogs
3. ✅ Implement `DialogService` - user messaging
4. ✅ Implement `ExportService` - GPX import/export
5. ✅ Implement `MapService` - Google Maps wrapper
6. ✅ Implement `IPCService` - IPC communication
7. ✅ Update `Application.js` to use services
8. ✅ Test file operations still work
9. ✅ Fix Shift+Right Click auto-routing (async dialog bug)

**Success Criteria**: All Electron/Node APIs isolated in services ✅

**Status**: Completed and tested. All services extracted and working.

---

### Phase 3: Refine Domain Models ✅ **COMPLETED**

**Status**: Completed with revised approach (keeping Knockout for templates)

**Revised Approach**:
After attempting to remove Knockout observables, we discovered that the HTML templates are tightly coupled to Knockout's `data-bind` system. Completely removing Knockout would require rewriting all templates, which is better suited for Phase 7 (Modernize CSS/Templates).

**Revised Goal**: Improve model business logic while keeping Knockout for UI binding

**Completed Tasks**:
1. ✅ Remove DOM manipulation from models (completed in Phase 6)
2. ✅ Remove file I/O from models (completed in Phase 2 - moved to Services)
3. ✅ Add validation methods to Roadbook and Waypoint models
4. ✅ Add distance/bearing calculation methods to Waypoint
5. ✅ Add proper `toJSON()` methods for serialization
6. ✅ Add utility methods (getStats, getWaypointByNumber, etc.)
7. ✅ Document model responsibilities and dependencies
8. ✅ Keep Knockout observables (required for existing templates)

**What Was Added**:

**Roadbook Model**:
- `validate()` - Validates roadbook data (name, waypoints, coordinates)
- `hasUnsavedChanges()` - Checks for unsaved modifications
- `isValidLatitude()` / `isValidLongitude()` - Coordinate validation
- `getWaypointByNumber()` - Get waypoint by 1-based index
- `getWaypointByRouteIndex()` - Get waypoint by route point index
- `getWaypointCount()` - Total waypoint count
- `isEmpty()` - Check if roadbook has no waypoints
- `clearWaypoints()` - Remove all waypoints
- `getStats()` - Get roadbook statistics (distance, waypoint count, etc.)
- Comprehensive JSDoc documentation

**Waypoint Model**:
- `validate()` - Validates waypoint data (coordinates, distances, heading)
- `isValidLatitude()` / `isValidLongitude()` - Coordinate validation
- `getPosition()` / `setPosition()` - Position getter/setter
- `hasNote()` - Check if waypoint has notes
- `hasNotification()` - Check if waypoint has notifications
- `distanceTo(otherWaypoint)` - Calculate distance using Haversine formula
- `bearingTo(otherWaypoint)` - Calculate bearing to another waypoint
- `toRad()` - Degrees to radians conversion
- `toJSON()` - Proper serialization
- Comprehensive JSDoc documentation

**Success Criteria**: ✅ All completed
- ✅ Models have clear responsibilities documented
- ✅ Business logic separated from UI concerns where possible
- ✅ Validation methods added
- ✅ Proper serialization methods
- ✅ Utility methods for common operations
- ✅ Knockout observables kept (required for templates)
- ✅ DOM manipulation removed (Phase 6)
- ✅ File I/O removed (Phase 2)

---

### Phase 4: Create Controllers (Week 5) 🔄 **IN PROGRESS**

**Goal**: Extract coordination logic from Application.js

**Tasks:**
1. Create `controllers/` directory
2. Implement `RoadbookController`
3. Implement `MapController`
4. Implement `UIController`
5. Implement `PaletteController` (for waypoint editing)
6. Move logic from `Application.js` to controllers
7. Test all workflows

**Success Criteria**: Application.js is just bootstrap code

---

### Phase 5: Add Event Bus (Week 6) ✅ **COMPLETED**

**Goal**: Decouple components with events

**Tasks:**
1. ✅ Create `EventBus` class
2. ✅ Define standard event names
3. ✅ Update controllers to emit events
4. ✅ Update UI to listen for events
5. ✅ Replace IPC spaghetti with clean events
6. ✅ Test event flow

**Success Criteria**: Components communicate via events, not direct calls

**Implementation Summary:**
- Created `EventBus` class with `on`, `emit`, `off`, `once`, and `clear` methods
- Defined standard event constants (ROADBOOK_LOADED, ROADBOOK_SAVED, EXPORT_COMPLETED, etc.)
- Updated RoadbookController to emit events on open, save, export operations
- Updated UIController to listen for events and update UI accordingly
- Updated WaypointController to emit events on waypoint editing
- Added event listeners in Application.js for debugging and logging
- All components now communicate through EventBus instead of direct coupling

---

### Phase 6: Replace jQuery (Week 7-8) ✅ **COMPLETED**

**Goal**: Convert to vanilla JavaScript

**Tasks:**
1. Replace jQuery selectors with `querySelector/querySelectorAll`
2. Replace `.click()` with `addEventListener('click')`
3. Replace `.addClass/.removeClass` with `classList`
4. Replace `.show/.hide` with direct style manipulation
5. Replace `.val()` with `.value`
6. Replace jQuery animations with CSS transitions
7. Remove jQuery from `package.json`
8. Test all UI interactions

**jQuery to Vanilla JS Quick Reference:**

```javascript
// Selectors
$('#id')                    → document.querySelector('#id')
$('.class')                 → document.querySelectorAll('.class')
$(element).find('.class')   → element.querySelectorAll('.class')

// Events
$(el).click(fn)             → el.addEventListener('click', fn)
$(el).on('event', fn)       → el.addEventListener('event', fn)
$(el).off('event', fn)      → el.removeEventListener('event', fn)

// Classes
$(el).addClass('name')      → el.classList.add('name')
$(el).removeClass('name')   → el.classList.remove('name')
$(el).toggleClass('name')   → el.classList.toggle('name')
$(el).hasClass('name')      → el.classList.contains('name')

// Attributes
$(el).attr('name')          → el.getAttribute('name')
$(el).attr('name', 'val')   → el.setAttribute('name', 'val')
$(el).data('key')           → el.dataset.key

// Styles
$(el).show()                → el.style.display = 'block'
$(el).hide()                → el.style.display = 'none'
$(el).css('prop', 'val')    → el.style.prop = 'val'

// Content
$(el).text()                → el.textContent
$(el).text('txt')           → el.textContent = 'txt'
$(el).html()                → el.innerHTML
$(el).html('<p>txt</p>')    → el.innerHTML = '<p>txt</p>'

// Forms
$(input).val()              → input.value
$(input).val('text')        → input.value = 'text'

// AJAX (use fetch instead)
$.ajax({...})               → fetch(url, {...})
```

**Success Criteria**: No jQuery dependency, all UI works

---

### Phase 7: Modernize CSS (Week 9)

**Goal**: Replace Foundation with modern CSS

**Tasks:**
1. Audit Foundation usage
2. Replace grid with CSS Grid/Flexbox
3. Replace Foundation components with custom CSS
4. Add Tailwind CSS (optional) or write custom CSS
5. Remove Foundation from dependencies
6. Test responsive layout

**Success Criteria**: No Foundation dependency, UI looks the same

---

### Phase 8: Add Build Tooling (Week 10)

**Goal**: Modern development experience

**Tasks:**
1. Add Vite for bundling
2. Configure Vite for Electron
3. Add TypeScript support (optional)
4. Add ESLint
5. Add Prettier
6. Set up hot reload for development
7. Configure production build

**Success Criteria**: Fast dev server, optimized production builds

---

### Phase 9: Settings UI for API Keys (Week 11) ✅ **COMPLETED**

**Goal**: User-friendly API key management with automatic first-time setup

**Tasks:**
1. Create `SettingsService.js` - Read/write api_keys.js file
2. Create `Settings.js` model - Data and validation
3. Create `SettingsController.js` - Workflow coordination
4. Create `SettingsView.js` - UI rendering (vanilla JS, custom CSS)
5. Create `settings.css` - Modern modal styling
6. Add Settings menu item and keyboard shortcut (Cmd+,)
7. Implement first-time setup detection
8. Auto-open Settings if api_keys.js doesn't exist
9. Prevent Settings cancellation during first-time setup
10. Auto-reload app after first-time setup

**Success Criteria**:
- Settings accessible via menu and keyboard shortcut
- New users automatically prompted for API keys
- API keys validated before saving
- File created/updated with proper format
- No API keys committed to git

**Status**: ✅ Completed and tested

---

### Phase 10: Help UI with Keyboard Shortcuts (Week 12)

**Goal**: In-app help system showing keyboard shortcuts and documentation

**Tasks:**
1. Create `HelpService.js` - Manage help content, keyboard shortcuts, and mouse controls data
2. Create `Help.js` model - Store and organize help content (shortcuts, mouse controls, getting started)
3. Create `HelpController.js` - Coordinate help display and tab navigation
4. Create `HelpView.js` - Render help modal with tabbed interface (vanilla JS, custom CSS)
5. Create `help.css` - Modern modal styling with tabbed interface and responsive design
6. Add Help menu item and keyboard shortcut (Cmd+? or F1)
7. Document all keyboard shortcuts organized by category (File, Edit, Tracks, View, I/O, General)
8. Document all mouse interactions organized by context (Map, Markers, Waypoint Palette)
9. Add searchable/filterable content across all tabs
10. Create "Getting Started" guide with step-by-step instructions
11. Include "About Tulip" information (version, Electron version, credits, license)
12. Add platform detection for Mac vs Windows/Linux shortcuts display

**Implementation Details:**

**Architecture (Service-Oriented):**
```
HelpService (data provider)
    ↓
Help Model (content structure)
    ↓
HelpController (coordination)
    ↓
HelpView (UI rendering)
```

**Help Content Structure:**
```javascript
{
  shortcuts: {
    file: [
      { action: 'Settings', mac: 'Cmd+,', win: 'Ctrl+,' },
      { action: 'Save', mac: 'Cmd+S', win: 'Ctrl+S' },
      { action: 'Save As', mac: 'Cmd+Shift+S', win: 'Ctrl+Shift+S' },
      { action: 'Open', mac: 'Cmd+O', win: 'Ctrl+O' },
      { action: 'Quit', mac: 'Cmd+Q', win: 'Ctrl+Q' },
    ],
    edit: [
      { action: 'Undo', mac: 'Cmd+Z', win: 'Ctrl+Z' },
      { action: 'Redo', mac: 'Cmd+Shift+Z', win: 'Ctrl+Shift+Z' },
      { action: 'Cut', mac: 'Cmd+X', win: 'Ctrl+X' },
      { action: 'Copy', mac: 'Cmd+C', win: 'Ctrl+C' },
      { action: 'Paste', mac: 'Cmd+V', win: 'Ctrl+V' },
      { action: 'Select All', mac: 'Cmd+A', win: 'Ctrl+A' },
    ],
    tracks: [
      { action: 'Add Track 0° (360°)', mac: 'Cmd+1', win: 'Ctrl+1' },
      { action: 'Add Track 45°', mac: 'Cmd+2', win: 'Ctrl+2' },
      { action: 'Add Track 90°', mac: 'Cmd+3', win: 'Ctrl+3' },
      { action: 'Add Track 135°', mac: 'Cmd+4', win: 'Ctrl+4' },
      { action: 'Add Track 180°', mac: 'Cmd+5', win: 'Ctrl+5' },
      { action: 'Add Track 225°', mac: 'Cmd+6', win: 'Ctrl+6' },
      { action: 'Add Track 270°', mac: 'Cmd+7', win: 'Ctrl+7' },
      { action: 'Add Track 315°', mac: 'Cmd+8', win: 'Ctrl+8' },
      { action: 'Set Track HP (Off-piste)', mac: 'Cmd+Opt+1', win: 'Ctrl+Alt+1' },
      { action: 'Set Track P (Track)', mac: 'Cmd+Opt+2', win: 'Ctrl+Alt+2' },
      { action: 'Set Track PP (Road)', mac: 'Cmd+Opt+3', win: 'Ctrl+Alt+3' },
      { action: 'Set Track RO (Main Road)', mac: 'Cmd+Opt+4', win: 'Ctrl+Alt+4' },
      { action: 'Set Track DCW (Divided Road)', mac: 'Cmd+Opt+5', win: 'Ctrl+Alt+5' },
      { action: 'Add Glyph', mac: 'Cmd+Opt+G', win: 'Ctrl+Alt+G' },
    ],
    io: [
      { action: 'Import GPX', mac: 'Cmd+I', win: 'Ctrl+I' },
      { action: 'Export GPX', mac: 'Cmd+E', win: 'Ctrl+E' },
      { action: 'Export PDF', mac: 'Cmd+P', win: 'Ctrl+P' },
    ],
    view: [
      { action: 'Reload', mac: 'Cmd+R', win: 'Ctrl+R' },
      { action: 'Toggle Roadbook Panel', mac: 'Cmd+B', win: 'Ctrl+B' },
      { action: 'Zoom In', mac: 'Cmd+Plus', win: 'Ctrl+Plus' },
      { action: 'Zoom Out', mac: 'Cmd+-', win: 'Ctrl+-' },
      { action: 'Toggle Developer Tools', mac: 'Cmd+Opt+I', win: 'Ctrl+Shift+I' },
    ],
    general: [
      { action: 'Escape', description: 'Exit delete modes, cancel operations' },
    ]
  },
  mouseControls: {
    map: [
      { action: 'Click on map', description: 'Add route point at clicked location' },
      { action: 'Shift+Right Click on map', description: 'Auto-route using Google Directions API from last point to clicked location (shows confirmation dialog)' },
      { action: 'Hover over route', description: 'Shows draggable handle to insert new point on route' },
      { action: 'Click+Drag route handle', description: 'Insert and position new route point between existing points' },
    ],
    markers: [
      { action: 'Click on waypoint marker', description: 'Scroll roadbook to show that waypoint' },
      { action: 'Right Click on marker', description: 'Delete the route point/waypoint' },
      { action: 'Double Click on marker', description: 'Toggle between waypoint and regular route point' },
      { action: 'Drag marker', description: 'Move route point to new location (updates distances and route)' },
    ],
    waypoints: [
      { action: 'Click waypoint in roadbook', description: 'Open waypoint palette for editing tulip and notes' },
      { action: 'Click track grid (palette)', description: 'Add track at selected angle to tulip diagram' },
      { action: 'Click track grid (undo)', description: 'Remove last added track from tulip' },
      { action: 'Shift+Click track grid (undo)', description: 'Enter track removal mode (click tracks to remove)' },
      { action: 'Click track type selector', description: 'Change track type (HP/P/PP/RO/DCW) for new tracks' },
      { action: 'Click glyph grid', description: 'Add glyph at selected position in tulip' },
      { action: 'Shift+Click glyph grid', description: 'Enter glyph removal mode (click glyphs to remove)' },
      { action: 'Click note glyph insertion', description: 'Add glyph to waypoint note' },
    ]
  },
  about: {
    version: '1.8.2',
    electron: '33.0.0',
    description: 'Rally roadbook creation tool',
    // ...
  },
  gettingStarted: [
    { title: 'Setup API Keys', content: 'Configure your Google Maps API keys via Settings (Cmd+,)...' },
    { title: 'Create Your First Roadbook', content: 'Click on the map to add route points...' },
    { title: 'Add Waypoints', content: 'Double-click any route point to convert it to a waypoint...' },
    { title: 'Edit Waypoint Tulips', content: 'Click a waypoint in the roadbook panel to open the editing palette...' },
    { title: 'Auto-Route with Directions', content: 'Shift+Right Click on the map to auto-route from your last point...' },
    { title: 'Save and Export', content: 'Save your roadbook (Cmd+S) and export to GPX or PDF...' },
  ]
}
```

**UI Features:**
- Tabbed interface: "Keyboard Shortcuts", "Mouse Controls", "Getting Started", "About"
- **Keyboard Shortcuts tab:**
  - Grouped by category (File, Edit, Tracks, View, I/O, General)
  - Platform-specific display (shows Mac or Windows shortcuts)
  - Search/filter functionality
  - Visual keyboard key styling (e.g., `⌘ Cmd` + `S`)
  - All 40+ keyboard shortcuts documented
- **Mouse Controls tab:**
  - Map interactions (click, Shift+Right Click for auto-routing, hover, drag)
  - Marker interactions (click, right-click to delete, double-click to toggle waypoint, drag)
  - Waypoint palette interactions (track grid, glyph grid, track type selectors)
  - Visual diagrams showing click locations (optional)
  - Modifier key combinations (Shift+Click, etc.)
- **Getting Started tab:**
  - Step-by-step guide for new users
  - Covers: API setup, creating roadbooks, adding waypoints, editing tulips, auto-routing
  - Screenshots/diagrams (optional)
- **About tab:**
  - Version information
  - Electron version
  - Credits and licenses
  - Links to documentation/GitHub

**Keyboard Shortcut Display:**
- Use platform detection to show correct shortcuts
- Mac: Show ⌘, ⌥, ⇧ symbols
- Windows/Linux: Show Ctrl, Alt, Shift text
- Consistent visual styling for all key combinations

**Menu Integration:**
- Add to application menu: "Help" → "Keyboard Shortcuts"
- Keyboard shortcut: `Cmd+?` (Mac) or `F1` (Windows/Linux)
- Also accessible from right off-canvas menu

**Success Criteria**:
- Help accessible via menu and keyboard shortcut (Cmd+? or F1)
- All 40+ keyboard shortcuts documented and categorized
- All mouse interactions documented:
  - Map interactions (click, Shift+Right Click auto-routing, hover, drag handles)
  - Marker interactions (click, right-click delete, double-click toggle, drag)
  - Waypoint palette interactions (track/glyph grids, Shift+Click modes)
- Platform-specific shortcuts displayed correctly (Mac vs Windows/Linux)
- Search/filter works smoothly across all tabs
- Tabbed navigation works (Keyboard Shortcuts, Mouse Controls, Getting Started, About)
- Modal UI consistent with Settings modal styling
- No jQuery or Foundation dependencies (vanilla JS + modern CSS)
- Keyboard navigation works (Tab, Escape, arrow keys)
- Responsive design for smaller screens
- Print-friendly stylesheet (optional)

**Benefits**:
- ✅ Improved discoverability of features
- ✅ Reduces learning curve for new users
- ✅ Professional in-app documentation
- ✅ Demonstrates complete SOA architecture
- ✅ Foundation for future help content

---

## Testing Strategy

### Unit Tests (Models & Services)

```javascript
// tests/models/Roadbook.test.js
import { Roadbook } from '../../models/Roadbook.js';
import { Waypoint } from '../../models/Waypoint.js';

describe('Roadbook', () => {
  test('calculates total distance correctly', () => {
    const roadbook = new Roadbook();
    roadbook.addWaypoint(new Waypoint(0, 0));
    roadbook.addWaypoint(new Waypoint(0, 1));

    expect(roadbook.totalDistance).toBeGreaterThan(0);
  });

  test('serializes to JSON correctly', () => {
    const roadbook = new Roadbook();
    roadbook.name = 'Test Roadbook';
    roadbook.addWaypoint(new Waypoint(0, 0));

    const json = roadbook.toJSON();
    expect(json.name).toBe('Test Roadbook');
    expect(json.waypoints).toHaveLength(1);
  });

  test('deserializes from JSON correctly', () => {
    const json = {
      name: 'Test',
      description: 'Desc',
      waypoints: [
        { lat: 0, lng: 0, tulip: { tracks: [], glyphs: [] } }
      ]
    };

    const roadbook = Roadbook.fromJSON(json);
    expect(roadbook.name).toBe('Test');
    expect(roadbook.waypoints).toHaveLength(1);
  });
});
```

### Integration Tests (Controllers)

```javascript
// tests/controllers/RoadbookController.test.js
import { RoadbookController } from '../../controllers/RoadbookController.js';

describe('RoadbookController', () => {
  let controller;
  let mockFileService;
  let mockEventBus;

  beforeEach(() => {
    mockFileService = {
      openFile: jest.fn(),
      saveFile: jest.fn()
    };
    mockEventBus = {
      emit: jest.fn()
    };

    controller = new RoadbookController(
      new Roadbook(),
      mockFileService,
      null,
      null,
      mockEventBus
    );
  });

  test('opens roadbook and emits event', async () => {
    mockFileService.openFile.mockResolvedValue('{"name": "Test"}');

    await controller.openRoadbook();

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'roadbook:loaded',
      expect.any(Object)
    );
  });
});
```

---

## Benefits Summary

### Technical Benefits

✅ **Maintainability**: Clear separation makes code easier to understand
✅ **Testability**: Each layer can be tested independently
✅ **Scalability**: Easy to add new features without breaking existing code
✅ **Performance**: Smaller bundle size, faster startup
✅ **Security**: Modern Electron security practices
✅ **Developer Experience**: Better tooling, hot reload, type safety (with TS)

### Business Benefits

✅ **Lower maintenance cost**: Easier to fix bugs
✅ **Faster feature development**: Clean architecture speeds up changes
✅ **Better reliability**: More testable = fewer bugs
✅ **Future-proof**: Can adopt new technologies incrementally
✅ **Easier onboarding**: New developers understand code faster

---

## Risk Mitigation

### Risks & Mitigations

1. **Risk**: Breaking existing functionality during refactor
   **Mitigation**: Incremental migration, keep old code working alongside new

2. **Risk**: Electron upgrade breaks printing/PDF export
   **Mitigation**: Test printing early, have rollback plan

3. **Risk**: Time estimates too optimistic
   **Mitigation**: Each phase is independently valuable, can pause anytime

4. **Risk**: Losing domain knowledge during rewrite
   **Mitigation**: Keep original developers involved, document as we go

5. **Risk**: New architecture doesn't fit use cases
   **Mitigation**: Build proof-of-concept first, validate approach

---

## Success Metrics

### Technical Metrics
- [ ] Bundle size reduced by 30%+
- [ ] Startup time reduced by 20%+
- [ ] Test coverage >70%
- [ ] Zero critical vulnerabilities (npm audit)
- [ ] All features working on Electron 33+

### Code Quality Metrics
- [ ] Application.js under 200 lines (down from 569)
- [ ] No files over 300 lines
- [ ] All services under 150 lines
- [ ] All models testable without DOM/Electron
- [ ] ESLint passing with no warnings

### Developer Experience
- [ ] Hot reload working in development
- [ ] Build time under 5 seconds
- [ ] Clear error messages
- [ ] TypeScript autocomplete working (if added)

---

## Next Steps

1. **Review this plan** with the team
2. **Create feature branch** for Phase 1 (Electron upgrade)
3. **Set up project board** to track progress
4. **Schedule weekly reviews** to assess progress
5. **Start Phase 1** - Electron upgrade

---

## References

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Vanilla JS vs jQuery Performance](https://youmightnotneedjquery.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Service-Oriented Architecture](https://en.wikipedia.org/wiki/Service-oriented_architecture)

---

## Document History

- **2025-03-05**: Initial version created
- **Author**: Development team
- **Status**: Proposed
