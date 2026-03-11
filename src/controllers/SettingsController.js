/*
  ---------------------------------------------------------------------------
  SettingsController - Coordinates settings workflow

  Responsibilities:
  - Coordinate between SettingsService, Settings model, and SettingsView
  - Handle user actions (open, save, cancel)
  - Show error/success dialogs
  - Validate before saving

  Following the Service-Oriented Architecture pattern, this controller
  orchestrates the workflow without containing business logic or I/O code.
  ---------------------------------------------------------------------------
*/

var SettingsController = Class({

  create: function(settingsService, settings, settingsView, dialog) {
    this.settingsService = settingsService;
    this.settings = settings;
    this.settingsView = settingsView;
    this.dialog = dialog;

    // Bind view events
    this.bindViewEvents();
  },

  /*
    Bind events from the view
  */
  bindViewEvents: function() {
    var _this = this;

    // Save button clicked
    this.settingsView.onSave(function() {
      _this.saveSettings();
    });

    // Cancel button clicked
    this.settingsView.onCancel(function() {
      _this.cancelSettings();
    });

    // Field changed
    this.settingsView.onFieldChange(function(field, value) {
      _this.handleFieldChange(field, value);
    });
  },

  /*
    Open settings modal
    Parameters:
    - isFirstTimeSetup: boolean (optional) - if true, shows first-time setup message
  */
  openSettings: async function(isFirstTimeSetup) {
    var _this = this;

    try {
      // Load current settings from file
      var data = await this.settingsService.readApiKeys();
      this.settings.load(data, isFirstTimeSetup);

      // Show the view
      this.settingsView.show(this.settings);

    } catch (error) {
      this.dialog.showMessageBox({
        type: 'error',
        message: 'Failed to load settings',
        detail: error.message,
        buttons: ['OK']
      });
    }
  },

  /*
    Handle field change
  */
  handleFieldChange: function(field, value) {
    if (field === 'googleMapsKey') {
      this.settings.setGoogleMapsKey(value);
    } else if (field === 'googleDirectionsKey') {
      this.settings.setGoogleDirectionsKey(value);
    }
  },

  /*
    Save settings
  */
  saveSettings: async function() {
    var _this = this;

    // Validate
    var validation = this.settings.validate();
    if (!validation.valid) {
      this.settingsView.showErrors(validation.errors);
      return;
    }

    try {
      // Write to file
      await this.settingsService.writeApiKeys(
        this.settings.googleMapsKey,
        this.settings.googleDirectionsKey
      );

      // Mark as saved
      this.settings.markAsSaved();

      // Hide view
      this.settingsView.hide();

      // Show success message
      var message = this.settings.isFirstTimeSetup
        ? 'API keys saved successfully!'
        : 'Settings saved successfully!';

      var detail = this.settings.isFirstTimeSetup
        ? 'The application will now load the map with your API keys.'
        : 'Please restart the application for changes to take effect.';

      await this.dialog.showMessageBox({
        type: 'info',
        message: message,
        detail: detail,
        buttons: ['OK']
      });

      // If first-time setup, reload the page to load the map
      if (this.settings.isFirstTimeSetup) {
        location.reload();
      }

    } catch (error) {
      this.dialog.showMessageBox({
        type: 'error',
        message: 'Failed to save settings',
        detail: error.message,
        buttons: ['OK']
      });
    }
  },

  /*
    Cancel settings (with confirmation if modified)
  */
  cancelSettings: async function() {
    var _this = this;

    // If first-time setup, don't allow cancel
    if (this.settings.isFirstTimeSetup) {
      await this.dialog.showMessageBox({
        type: 'warning',
        message: 'API keys required',
        detail: 'Please enter your Google Maps API keys to use the application.',
        buttons: ['OK']
      });
      return;
    }

    // If not dirty, just close
    if (!this.settings.isDirty) {
      this.settingsView.hide();
      return;
    }

    // Ask for confirmation
    var result = await this.dialog.showMessageBox({
      type: 'question',
      message: 'Discard unsaved changes?',
      detail: 'You have unsaved changes. Are you sure you want to discard them?',
      buttons: ['Discard', 'Cancel'],
      defaultId: 1,
      cancelId: 1
    });

    // If user confirmed, reset and close
    if (result.response === 0) {
      this.settings.reset();
      this.settingsView.hide();
    }
  }

});
