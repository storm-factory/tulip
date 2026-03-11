/*
  ============================================================================
  Help Controller
  ============================================================================

  RESPONSIBILITIES:
  - Coordinate help modal display and hiding
  - Handle tab navigation
  - Handle search/filter
  - Emit events via EventBus
  - No business logic, no I/O, coordination only

  DEPENDENCIES:
  - Help model
  - HelpView
  - EventBus (Phase 5)

  Phase 10: Help UI with Keyboard Shortcuts
*/

class HelpController {
  constructor(helpModel, helpView, eventBus) {
    this.model = helpModel;
    this.view = helpView;
    this.eventBus = eventBus;

    this.bindViewEvents();
  }

  /**
   * Bind to view events
   */
  bindViewEvents() {
    // View will call these methods when user interacts
    this.view.onTabChange = (tabName) => this.changeTab(tabName);
    this.view.onSearch = (query) => this.search(query);
    this.view.onClose = () => this.closeHelp();
  }

  /**
   * Open help modal
   * @param {string} tabName - Optional tab to open (defaults to shortcuts)
   */
  openHelp(tabName = 'shortcuts') {
    this.model.setTab(tabName);
    this.model.clearSearch();

    // Render and show view
    this.view.render(this.model);
    this.view.show();

    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('help:opened', { tab: tabName });
    }
  }

  /**
   * Close help modal
   */
  closeHelp() {
    this.view.hide();

    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('help:closed');
    }
  }

  /**
   * Change active tab
   * @param {string} tabName
   */
  changeTab(tabName) {
    this.model.setTab(tabName);
    this.view.updateActiveTab(tabName);
    this.view.renderTabContent(this.model);

    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('help:tabChanged', { tab: tabName });
    }
  }

  /**
   * Handle search query
   * @param {string} query
   */
  search(query) {
    this.model.setSearch(query);
    this.view.renderTabContent(this.model);

    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('help:searched', { query: query });
    }
  }

  /**
   * Clear search and reset view
   */
  clearSearch() {
    this.model.clearSearch();
    this.view.renderTabContent(this.model);
  }
}
