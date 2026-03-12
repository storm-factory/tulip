/*
  ============================================================================
  Help Model
  ============================================================================

  RESPONSIBILITIES:
  - Store and organize help content
  - Provide search/filter capabilities
  - Track current tab selection
  - No I/O, no DOM, pure business logic

  DEPENDENCIES:
  - None (pure JavaScript)

  Phase 10: Help UI with Keyboard Shortcuts
*/

class Help {
  constructor(helpService) {
    this.helpService = helpService;
    this.shortcuts = helpService.getKeyboardShortcuts();
    this.mouseControls = helpService.getMouseControls();
    this.gettingStarted = helpService.getGettingStarted();
    this.about = helpService.getAboutInfo();
    this.currentTab = 'shortcuts'; // 'shortcuts', 'mouse', 'gettingStarted', 'about'
    this.searchQuery = '';
  }

  /**
   * Set current active tab
   * @param {string} tabName
   */
  setTab(tabName) {
    const validTabs = ['shortcuts', 'mouse', 'gettingStarted', 'about'];
    if (validTabs.includes(tabName)) {
      this.currentTab = tabName;
    }
  }

  /**
   * Set search query
   * @param {string} query
   */
  setSearch(query) {
    this.searchQuery = query.toLowerCase();
  }

  /**
   * Clear search
   */
  clearSearch() {
    this.searchQuery = '';
  }

  /**
   * Filter keyboard shortcuts by search query
   * @returns {Object} Filtered shortcuts by category
   */
  getFilteredShortcuts() {
    if (!this.searchQuery) {
      return this.shortcuts;
    }

    const filtered = {};
    Object.keys(this.shortcuts).forEach(category => {
      const matches = this.shortcuts[category].filter(shortcut => {
        const searchText = `${shortcut.action} ${shortcut.mac || ''} ${shortcut.win || ''} ${shortcut.description || ''}`.toLowerCase();
        return searchText.includes(this.searchQuery);
      });

      if (matches.length > 0) {
        filtered[category] = matches;
      }
    });

    return filtered;
  }

  /**
   * Filter mouse controls by search query
   * @returns {Object} Filtered mouse controls by context
   */
  getFilteredMouseControls() {
    if (!this.searchQuery) {
      return this.mouseControls;
    }

    const filtered = {};
    Object.keys(this.mouseControls).forEach(context => {
      const matches = this.mouseControls[context].filter(control => {
        const searchText = `${control.action} ${control.description}`.toLowerCase();
        return searchText.includes(this.searchQuery);
      });

      if (matches.length > 0) {
        filtered[context] = matches;
      }
    });

    return filtered;
  }

  /**
   * Filter getting started steps by search query
   * @returns {Array} Filtered steps
   */
  getFilteredGettingStarted() {
    if (!this.searchQuery) {
      return this.gettingStarted;
    }

    return this.gettingStarted.filter(step => {
      const searchText = `${step.title} ${step.content}`.toLowerCase();
      return searchText.includes(this.searchQuery);
    });
  }

  /**
   * Get total count of keyboard shortcuts
   * @returns {number}
   */
  getShortcutCount() {
    return Object.values(this.shortcuts).reduce((total, category) => {
      return total + category.length;
    }, 0);
  }

  /**
   * Get total count of mouse controls
   * @returns {number}
   */
  getMouseControlCount() {
    return Object.values(this.mouseControls).reduce((total, context) => {
      return total + context.length;
    }, 0);
  }

  /**
   * Capitalize category name for display
   * @param {string} category
   * @returns {string}
   */
  formatCategoryName(category) {
    const names = {
      file: 'File',
      edit: 'Edit',
      tracks: 'Tracks',
      io: 'Import/Export',
      view: 'View',
      general: 'General',
      map: 'Map',
      markers: 'Markers',
      waypoints: 'Waypoint Palette'
    };
    return names[category] || category;
  }
}
