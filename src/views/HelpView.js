/*
  ============================================================================
  Help View
  ============================================================================

  RESPONSIBILITIES:
  - Render help modal with tabbed interface
  - Handle user interactions (tab clicks, search, close)
  - Update DOM based on model data
  - Vanilla JavaScript only (no jQuery)
  - No business logic, UI rendering only

  DEPENDENCIES:
  - None (pure vanilla JavaScript)

  Phase 10: Help UI with Keyboard Shortcuts
*/

class HelpView {
  constructor() {
    this.modal = null;
    this.overlay = null;
    this.tabContent = null;
    this.searchInput = null;

    // Callbacks set by controller
    this.onTabChange = null;
    this.onSearch = null;
    this.onClose = null;

    this.createModal();
    this.bindEvents();
  }

  /**
   * Create modal DOM structure
   */
  createModal() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'help-overlay';
    this.overlay.style.display = 'none';

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.className = 'help-modal';
    this.modal.innerHTML = `
      <div class="help-header">
        <h2>Tulip Help</h2>
        <button class="help-close" aria-label="Close help">&times;</button>
      </div>

      <div class="help-search">
        <input type="text" class="help-search-input" placeholder="Search help..." />
        <button class="help-search-clear" style="display: none;">&times;</button>
      </div>

      <div class="help-tabs">
        <button class="help-tab active" data-tab="shortcuts">Keyboard Shortcuts</button>
        <button class="help-tab" data-tab="mouse">Mouse Controls</button>
        <button class="help-tab" data-tab="gettingStarted">Getting Started</button>
        <button class="help-tab" data-tab="about">About</button>
      </div>

      <div class="help-content"></div>
    `;

    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Store references
    this.tabContent = this.modal.querySelector('.help-content');
    this.searchInput = this.modal.querySelector('.help-search-input');
    this.searchClear = this.modal.querySelector('.help-search-clear');
  }

  /**
   * Bind DOM event listeners
   */
  bindEvents() {
    const _this = this;

    // Close button
    const closeBtn = this.modal.querySelector('.help-close');
    closeBtn.addEventListener('click', () => {
      if (_this.onClose) _this.onClose();
    });

    // Overlay click to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === _this.overlay) {
        if (_this.onClose) _this.onClose();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _this.overlay.style.display === 'flex') {
        if (_this.onClose) _this.onClose();
      }
    });

    // Tab clicks
    const tabs = this.modal.querySelectorAll('.help-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        if (_this.onTabChange) _this.onTabChange(tabName);
      });
    });

    // Search input
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      _this.searchClear.style.display = query ? 'block' : 'none';
      if (_this.onSearch) _this.onSearch(query);
    });

    // Clear search button
    this.searchClear.addEventListener('click', () => {
      _this.searchInput.value = '';
      _this.searchClear.style.display = 'none';
      if (_this.onSearch) _this.onSearch('');
    });
  }

  /**
   * Show modal with animation
   */
  show() {
    this.overlay.style.display = 'flex';
    setTimeout(() => {
      this.overlay.classList.add('active');
    }, 10);
    this.searchInput.focus();
  }

  /**
   * Hide modal with animation
   */
  hide() {
    this.overlay.classList.remove('active');
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.searchInput.value = '';
      this.searchClear.style.display = 'none';
    }, 300);
  }

  /**
   * Render modal with model data
   * @param {Help} model
   */
  render(model) {
    this.updateActiveTab(model.currentTab);
    this.renderTabContent(model);
  }

  /**
   * Update active tab visual state
   * @param {string} tabName
   */
  updateActiveTab(tabName) {
    const tabs = this.modal.querySelectorAll('.help-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * Render content for current tab
   * @param {Help} model
   */
  renderTabContent(model) {
    switch (model.currentTab) {
      case 'shortcuts':
        this.renderShortcutsTab(model);
        break;
      case 'mouse':
        this.renderMouseTab(model);
        break;
      case 'gettingStarted':
        this.renderGettingStartedTab(model);
        break;
      case 'about':
        this.renderAboutTab(model);
        break;
    }
  }

  /**
   * Format keyboard shortcut with individual key badges
   * @param {string} shortcut - e.g., "Cmd+S" or "Ctrl+Shift+S"
   * @returns {string} HTML with individual kbd tags
   */
  formatShortcutKeys(shortcut) {
    if (!shortcut) return '';

    // Split by + and wrap each key in kbd tag
    const keys = shortcut.split('+');
    return keys.map(key => `<kbd>${key}</kbd>`).join(' + ');
  }

  /**
   * Render keyboard shortcuts tab
   * @param {Help} model
   */
  renderShortcutsTab(model) {
    const shortcuts = model.getFilteredShortcuts();
    const categories = Object.keys(shortcuts);

    if (categories.length === 0) {
      this.tabContent.innerHTML = '<p class="help-no-results">No shortcuts found matching your search.</p>';
      return;
    }

    let html = '<div class="help-shortcuts">';

    categories.forEach(category => {
      const categoryName = model.formatCategoryName(category);
      const items = shortcuts[category];

      html += `
        <div class="help-category">
          <h3>${categoryName}</h3>
          <table class="help-shortcuts-table">
            <tbody>
      `;

      items.forEach(shortcut => {
        const keys = model.helpService.formatShortcut(shortcut.mac, shortcut.win);
        const formattedKeys = this.formatShortcutKeys(keys);
        const description = shortcut.description || shortcut.action;

        html += `
          <tr>
            <td class="help-shortcut-action">${shortcut.action}</td>
            <td class="help-shortcut-keys">${formattedKeys}</td>
          </tr>
        `;

        if (shortcut.description && shortcut.description !== shortcut.action) {
          html += `
            <tr class="help-shortcut-desc">
              <td colspan="2">${shortcut.description}</td>
            </tr>
          `;
        }
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    html += '</div>';
    this.tabContent.innerHTML = html;
  }

  /**
   * Render mouse controls tab
   * @param {Help} model
   */
  renderMouseTab(model) {
    const controls = model.getFilteredMouseControls();
    const contexts = Object.keys(controls);

    if (contexts.length === 0) {
      this.tabContent.innerHTML = '<p class="help-no-results">No mouse controls found matching your search.</p>';
      return;
    }

    let html = '<div class="help-mouse">';

    contexts.forEach(context => {
      const contextName = model.formatCategoryName(context);
      const items = controls[context];

      html += `
        <div class="help-category">
          <h3>${contextName}</h3>
          <table class="help-mouse-table">
            <tbody>
      `;

      items.forEach(control => {
        html += `
          <tr>
            <td class="help-mouse-action"><strong>${control.action}</strong></td>
            <td class="help-mouse-desc">${control.description}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    html += '</div>';
    this.tabContent.innerHTML = html;
  }

  /**
   * Render getting started tab
   * @param {Help} model
   */
  renderGettingStartedTab(model) {
    const steps = model.getFilteredGettingStarted();

    if (steps.length === 0) {
      this.tabContent.innerHTML = '<p class="help-no-results">No getting started content found matching your search.</p>';
      return;
    }

    let html = '<div class="help-getting-started">';

    steps.forEach(step => {
      html += `
        <div class="help-step">
          <h3>${step.title}</h3>
          <p>${step.content}</p>
        </div>
      `;
    });

    html += '</div>';
    this.tabContent.innerHTML = html;
  }

  /**
   * Render about tab
   * @param {Help} model
   */
  renderAboutTab(model) {
    const about = model.about;

    let html = `
      <div class="help-about">
        <div class="help-about-header">
          <h3>${about.name}</h3>
          <p class="help-about-version">Version ${about.version}</p>
        </div>

        <div class="help-about-section">
          <p>${about.description}</p>
        </div>

        <div class="help-about-section">
          <h4>Technical Information</h4>
          <table class="help-about-table">
            <tbody>
              <tr>
                <td>Electron</td>
                <td>${about.electronVersion}</td>
              </tr>
              <tr>
                <td>Chrome</td>
                <td>${about.chromeVersion}</td>
              </tr>
              <tr>
                <td>Node.js</td>
                <td>${about.nodeVersion}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="help-about-section">
          <h4>Credits</h4>
          <ul class="help-about-credits">
    `;

    about.credits.forEach(credit => {
      html += `<li>${credit}</li>`;
    });

    html += `
          </ul>
        </div>

        <div class="help-about-section">
          <h4>Links</h4>
          <p>
            <a href="#" class="help-about-link" data-url="${about.github}">GitHub Repository</a>
          </p>
          <p class="help-about-license">License: ${about.license}</p>
        </div>
      </div>
    `;

    this.tabContent.innerHTML = html;

    // Bind external links to open in browser
    const links = this.tabContent.querySelectorAll('.help-about-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = link.dataset.url;
        require('electron').shell.openExternal(url);
      });
    });
  }
}
