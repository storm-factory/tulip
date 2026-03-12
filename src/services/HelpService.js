/*
  ============================================================================
  Help Service
  ============================================================================

  RESPONSIBILITIES:
  - Provide help content data (keyboard shortcuts, mouse controls)
  - Detect platform for correct shortcut display
  - Manage getting started guide content
  - Provide application version information
  - No UI logic, pure data provider

  DEPENDENCIES:
  - Node.js process module for platform detection

  Phase 10: Help UI with Keyboard Shortcuts
*/

class HelpService {
  constructor() {
    this.platform = process.platform;
  }

  /**
   * Get platform name for display
   * @returns {string} 'Mac', 'Windows', or 'Linux'
   */
  getPlatformName() {
    if (this.platform === 'darwin') return 'Mac';
    if (this.platform === 'win32') return 'Windows';
    return 'Linux';
  }

  /**
   * Check if running on Mac
   * @returns {boolean}
   */
  isMac() {
    return this.platform === 'darwin';
  }

  /**
   * Get all keyboard shortcuts organized by category
   * @returns {Object} Categorized shortcuts
   */
  getKeyboardShortcuts() {
    return {
      file: [
        { action: 'Settings', mac: 'Cmd+,', win: 'Ctrl+,' },
        { action: 'Save', mac: 'Cmd+S', win: 'Ctrl+S' },
        { action: 'Save As', mac: 'Cmd+Shift+S', win: 'Ctrl+Shift+S' },
        { action: 'Open', mac: 'Cmd+O', win: 'Ctrl+O' },
        { action: 'New Roadbook', mac: 'Cmd+N', win: 'Ctrl+N' },
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
        { action: 'Export OpenRally GPX', mac: 'Cmd+Shift+E', win: 'Ctrl+Shift+E' },
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
        { action: 'Help', mac: 'Cmd+?', win: 'F1', description: 'Open this help window' },
        { action: 'Escape', description: 'Exit delete modes, close modals, cancel operations' },
      ]
    };
  }

  /**
   * Get all mouse controls organized by context
   * @returns {Object} Mouse controls by context
   */
  getMouseControls() {
    return {
      map: [
        {
          action: 'Click on map',
          description: 'Add route point at clicked location'
        },
        {
          action: 'Shift+Right Click on map',
          description: 'Auto-route using Google Directions API from last point to clicked location (shows confirmation dialog)'
        },
        {
          action: 'Hover over route',
          description: 'Shows draggable handle to insert new point on route'
        },
        {
          action: 'Click+Drag route handle',
          description: 'Insert and position new route point between existing points'
        },
      ],
      markers: [
        {
          action: 'Click on waypoint marker',
          description: 'Scroll roadbook to show that waypoint'
        },
        {
          action: 'Right Click on marker',
          description: 'Enter delete mode - right-click two markers to delete all points between them'
        },
        {
          action: 'Double Click on marker',
          description: 'Toggle between waypoint (shown in roadbook) and regular route point'
        },
        {
          action: 'Drag marker',
          description: 'Move route point to new location (updates distances, headings, and route polyline)'
        },
      ],
      waypoints: [
        {
          action: 'Click waypoint in roadbook',
          description: 'Open waypoint palette for editing tulip diagram and notes'
        },
        {
          action: 'Click track grid (palette)',
          description: 'Add track at selected angle to tulip diagram'
        },
        {
          action: 'Right-click track grid',
          description: 'Remove last added track from tulip (undo)'
        },
        {
          action: 'Shift+Click track grid',
          description: 'Enter track removal mode - click on tracks in diagram to remove specific tracks'
        },
        {
          action: 'Click track type selector',
          description: 'Change track type (HP/P/PP/RO/DCW) for new tracks or selected existing track'
        },
        {
          action: 'Click glyph grid',
          description: 'Add glyph at selected position in tulip diagram'
        },
        {
          action: 'Shift+Click glyph grid',
          description: 'Enter glyph removal mode - click glyphs in diagram to remove them'
        },
        {
          action: 'Click note glyph button',
          description: 'Open glyph selector to insert glyph into waypoint note text'
        },
      ]
    };
  }

  /**
   * Get getting started guide steps
   * @returns {Array} Step-by-step guide
   */
  getGettingStarted() {
    return [
      {
        title: '1. Setup API Keys',
        content: 'Configure your Google Maps and Google Directions API keys via Settings (Cmd+, or Ctrl+,). You\'ll need both keys from the Google Cloud Console to use the map and auto-routing features.'
      },
      {
        title: '2. Create Your First Roadbook',
        content: 'Click "New Roadbook" (Cmd+N) or click the hamburger menu. Click on the map to add route points - each click adds a point to your route. The route polyline connects all your points.'
      },
      {
        title: '3. Add Waypoints',
        content: 'Double-click any route point (marker) to convert it to a waypoint. Waypoints appear in the roadbook panel on the left with distance, heading, and tulip diagram. Regular route points help shape the route but don\'t appear in the roadbook.'
      },
      {
        title: '4. Edit Waypoint Tulips',
        content: 'Click a waypoint in the roadbook panel to open the editing palette on the right. Use the track grid to add directional tracks at different angles (0°-360°). Change track types (HP, P, PP, RO, DCW) using the selectors. Add glyphs by clicking the glyph grid.'
      },
      {
        title: '5. Auto-Route with Directions',
        content: 'Shift+Right Click on the map to auto-route from your last point using Google Directions API. This adds multiple route points following roads. A confirmation dialog appears before adding points.'
      },
      {
        title: '6. Add Notes and Notifications',
        content: 'In the waypoint palette, add text notes and insert glyphs into notes. Special glyphs (WPM, WPS, DSZ, speed limits) create notifications with colored bubbles on the map.'
      },
      {
        title: '7. Adjust Route Points',
        content: 'Drag any marker to adjust the route. Right-click a marker to delete it (enter delete mode - right-click two markers to delete range). Hover over the route to insert new points using the handle.'
      },
      {
        title: '8. Save and Export',
        content: 'Save your roadbook (Cmd+S) as a .tlp file. Export to GPX (Cmd+E) for GPS devices or export to PDF (Cmd+P) for printing. Use "Export OpenRally GPX" for RallyComp/Tripy format with notifications.'
      },
    ];
  }

  /**
   * Get application information
   * @returns {Object} App version, credits, etc.
   */
  getAboutInfo() {
    const electron = require('electron');
    const app = electron.remote ? electron.remote.app : require('@electron/remote').app;

    return {
      name: 'Tulip',
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      description: 'Rally roadbook creation tool for navigation documents with tulip diagrams',
      license: 'MIT',
      github: 'https://github.com/dpeckham/tulip',
      credits: [
        'Created by Drew Mitchell',
        'Contributors: Chris Braun, Phil Walker, Tony Gurule, David Peckham, Luke Bennett',
        'Uses Google Maps API for mapping',
        'Uses Fabric.js for canvas rendering',
        'Uses Knockout.js for data binding'
      ]
    };
  }

  /**
   * Format keyboard shortcut for display
   * @param {string} mac - Mac shortcut
   * @param {string} win - Windows/Linux shortcut
   * @returns {string} Formatted shortcut for current platform
   */
  formatShortcut(mac, win) {
    const shortcut = this.isMac() ? mac : win;
    if (!shortcut) return '';

    // Use text labels for better compatibility and readability
    // The CSS will style these as keyboard keys
    return shortcut;
  }
}
