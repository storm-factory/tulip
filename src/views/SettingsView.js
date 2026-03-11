/*
  ---------------------------------------------------------------------------
  SettingsView - Pure UI rendering for settings modal

  Responsibilities:
  - Create and manage settings modal DOM
  - Handle user input events
  - Display validation errors
  - Show/hide animations

  Implemented in vanilla JavaScript (no jQuery), following Phase 6 of
  the modernization plan. All DOM manipulation is done using native APIs.
  ---------------------------------------------------------------------------
*/

var SettingsView = Class({

  create: function() {
    this.modalElement = null;
    this.overlayElement = null;
    this.callbacks = {
      save: null,
      cancel: null,
      fieldChange: null
    };

    this.createModal();
    this.attachEventListeners();
  },

  /*
    Create the modal DOM structure
  */
  createModal: function() {
    // Create overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'settings-overlay';
    this.overlayElement.className = 'settings-overlay';

    // Create modal container
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'settings-modal';
    this.modalElement.className = 'settings-modal';

    // Create modal content
    this.modalElement.innerHTML = `
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="settings-close" id="settings-close-btn" title="Close">&times;</button>
      </div>

      <div class="settings-body">
        <div class="settings-section">
          <h3>Google Maps API Keys</h3>
          <p class="settings-description">
            Configure your Google Maps API keys. You'll need to restart the application
            after saving for changes to take effect.
          </p>

          <div class="settings-field">
            <label for="google-maps-key">Google Maps API Key:</label>
            <input
              type="text"
              id="google-maps-key"
              placeholder="AIza..."
              autocomplete="off"
              spellcheck="false"
            />
            <p class="settings-help">
              Used for displaying the map interface.
            </p>
          </div>

          <div class="settings-field">
            <label for="google-directions-key">Google Directions API Key:</label>
            <input
              type="text"
              id="google-directions-key"
              placeholder="AIza..."
              autocomplete="off"
              spellcheck="false"
            />
            <p class="settings-help">
              Used for route directions and GPX import.
            </p>
          </div>

          <div class="settings-errors" id="settings-errors"></div>

          <div class="settings-info">
            <strong>To get your API keys:</strong>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
              <li>Create a new project or select existing</li>
              <li>Enable Maps JavaScript API and Directions API</li>
              <li>Go to "Credentials" and create an API key</li>
              <li>(Optional) Restrict the key to specific APIs for security</li>
            </ol>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <button class="settings-btn settings-btn-cancel" id="settings-cancel-btn">
          Cancel
        </button>
        <button class="settings-btn settings-btn-primary" id="settings-save-btn">
          Save Settings
        </button>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.overlayElement);
    document.body.appendChild(this.modalElement);
  },

  /*
    Attach event listeners
  */
  attachEventListeners: function() {
    var _this = this;

    // Save button
    var saveBtn = document.getElementById('settings-save-btn');
    saveBtn.addEventListener('click', function() {
      if (_this.callbacks.save) {
        _this.callbacks.save();
      }
    });

    // Cancel button
    var cancelBtn = document.getElementById('settings-cancel-btn');
    cancelBtn.addEventListener('click', function() {
      if (_this.callbacks.cancel) {
        _this.callbacks.cancel();
      }
    });

    // Close button
    var closeBtn = document.getElementById('settings-close-btn');
    closeBtn.addEventListener('click', function() {
      if (_this.callbacks.cancel) {
        _this.callbacks.cancel();
      }
    });

    // Overlay click
    this.overlayElement.addEventListener('click', function() {
      if (_this.callbacks.cancel) {
        _this.callbacks.cancel();
      }
    });

    // Field changes
    var mapsKeyInput = document.getElementById('google-maps-key');
    mapsKeyInput.addEventListener('input', function() {
      if (_this.callbacks.fieldChange) {
        _this.callbacks.fieldChange('googleMapsKey', this.value);
      }
      _this.clearErrors();
    });

    var directionsKeyInput = document.getElementById('google-directions-key');
    directionsKeyInput.addEventListener('input', function() {
      if (_this.callbacks.fieldChange) {
        _this.callbacks.fieldChange('googleDirectionsKey', this.value);
      }
      _this.clearErrors();
    });

    // Escape key closes modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && _this.isVisible()) {
        if (_this.callbacks.cancel) {
          _this.callbacks.cancel();
        }
      }
    });
  },

  /*
    Show the modal with settings data
  */
  show: function(settings) {
    // Populate fields
    document.getElementById('google-maps-key').value = settings.googleMapsKey;
    document.getElementById('google-directions-key').value = settings.googleDirectionsKey;

    // Update description for first-time setup
    var descriptionEl = this.modalElement.querySelector('.settings-description');
    if (settings.isFirstTimeSetup) {
      descriptionEl.innerHTML = '<strong>Welcome to Tulip!</strong><br>Please enter your Google Maps API keys to get started. The application requires these keys to display the map interface.';
      descriptionEl.style.color = '#0066cc';
      descriptionEl.style.fontWeight = '500';
    } else {
      descriptionEl.innerHTML = 'Configure your Google Maps API keys. You\'ll need to restart the application after saving for changes to take effect.';
      descriptionEl.style.color = '#666';
      descriptionEl.style.fontWeight = 'normal';
    }

    // Clear errors
    this.clearErrors();

    // Show modal with animation
    this.overlayElement.style.display = 'block';
    this.modalElement.style.display = 'block';

    // Trigger animation
    setTimeout(function() {
      this.overlayElement.classList.add('active');
      this.modalElement.classList.add('active');
    }.bind(this), 10);

    // Focus first field
    document.getElementById('google-maps-key').focus();
  },

  /*
    Hide the modal
  */
  hide: function() {
    var _this = this;

    // Remove active class for animation
    this.overlayElement.classList.remove('active');
    this.modalElement.classList.remove('active');

    // Hide after animation
    setTimeout(function() {
      _this.overlayElement.style.display = 'none';
      _this.modalElement.style.display = 'none';
    }, 300);
  },

  /*
    Check if modal is visible
  */
  isVisible: function() {
    return this.modalElement.style.display === 'block';
  },

  /*
    Show validation errors
  */
  showErrors: function(errors) {
    var errorsContainer = document.getElementById('settings-errors');
    errorsContainer.innerHTML = '';

    if (errors.length > 0) {
      var errorList = document.createElement('ul');
      errors.forEach(function(error) {
        var errorItem = document.createElement('li');
        errorItem.textContent = error;
        errorList.appendChild(errorItem);
      });

      errorsContainer.appendChild(errorList);
      errorsContainer.style.display = 'block';
    }
  },

  /*
    Clear validation errors
  */
  clearErrors: function() {
    var errorsContainer = document.getElementById('settings-errors');
    errorsContainer.innerHTML = '';
    errorsContainer.style.display = 'none';
  },

  /*
    Register save callback
  */
  onSave: function(callback) {
    this.callbacks.save = callback;
  },

  /*
    Register cancel callback
  */
  onCancel: function(callback) {
    this.callbacks.cancel = callback;
  },

  /*
    Register field change callback
  */
  onFieldChange: function(callback) {
    this.callbacks.fieldChange = callback;
  }

});
