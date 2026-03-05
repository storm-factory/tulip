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

### Phase 1: Electron Upgrade (Week 1-2)

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

### Phase 2: Extract Services (Week 3)

**Goal**: Create service layer and move all I/O out of Application.js

**Tasks:**
1. Create `services/` directory
2. Implement `FileService`
3. Implement `DialogService`
4. Implement `ExportService`
5. Implement `MapService`
6. Implement `IPCService`
7. Update `Application.js` to use services
8. Test file operations still work

**Success Criteria**: All Electron/Node APIs isolated in services

---

### Phase 3: Refine Domain Models (Week 4)

**Goal**: Make models pure JavaScript (no DOM, no I/O)

**Tasks:**
1. Review existing `Roadbook`, `Waypoint`, `Tulip` classes
2. Remove any DOM manipulation
3. Remove any file I/O
4. Add proper `toJSON` / `fromJSON` methods
5. Add distance calculation methods
6. Add validation methods
7. Write unit tests for models

**Success Criteria**: Models testable without DOM or Electron

---

### Phase 4: Create Controllers (Week 5)

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

### Phase 5: Add Event Bus (Week 6)

**Goal**: Decouple components with events

**Tasks:**
1. Create `EventBus` class
2. Define standard event names
3. Update controllers to emit events
4. Update UI to listen for events
5. Replace IPC spaghetti with clean events
6. Test event flow

**Success Criteria**: Components communicate via events, not direct calls

---

### Phase 6: Replace jQuery (Week 7-8)

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
