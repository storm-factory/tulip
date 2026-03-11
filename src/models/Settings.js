/*
  ---------------------------------------------------------------------------
  Settings Model - Pure business logic for API key settings

  Responsibilities:
  - Store API key values
  - Validate API key format
  - Track modification state
  - No I/O, no DOM - pure data and logic

  Following the Service-Oriented Architecture pattern, this model
  contains only business logic and validation.
  ---------------------------------------------------------------------------
*/

var Settings = Class({

  create: function() {
    this.googleMapsKey = '';
    this.googleDirectionsKey = '';
    this.isDirty = false;
    this.originalGoogleMapsKey = '';
    this.originalGoogleDirectionsKey = '';
    this.isFirstTimeSetup = false;
  },

  /*
    Load settings data
  */
  load: function(data, isFirstTimeSetup) {
    this.googleMapsKey = data.googleMapsKey || '';
    this.googleDirectionsKey = data.googleDirectionsKey || '';
    this.originalGoogleMapsKey = this.googleMapsKey;
    this.originalGoogleDirectionsKey = this.googleDirectionsKey;
    this.isDirty = false;
    this.isFirstTimeSetup = isFirstTimeSetup || false;
  },

  /*
    Set Google Maps API key
  */
  setGoogleMapsKey: function(key) {
    this.googleMapsKey = key;
    this.updateDirtyState();
  },

  /*
    Set Google Directions API key
  */
  setGoogleDirectionsKey: function(key) {
    this.googleDirectionsKey = key;
    this.updateDirtyState();
  },

  /*
    Update dirty state based on changes
  */
  updateDirtyState: function() {
    this.isDirty = (this.googleMapsKey !== this.originalGoogleMapsKey) ||
                   (this.googleDirectionsKey !== this.originalGoogleDirectionsKey);
  },

  /*
    Validate a single API key
    Google API keys typically start with "AIza" and are 39 characters

    Returns: { valid: boolean, error: string }
  */
  validateApiKey: function(key, fieldName) {
    if (!key || key.trim() === '') {
      return {
        valid: false,
        error: fieldName + ' cannot be empty'
      };
    }

    if (!key.startsWith('AIza')) {
      return {
        valid: false,
        error: fieldName + ' should start with "AIza"'
      };
    }

    if (key.length !== 39) {
      return {
        valid: false,
        error: fieldName + ' should be 39 characters long (current: ' + key.length + ')'
      };
    }

    return { valid: true, error: null };
  },

  /*
    Validate all settings
    Returns: { valid: boolean, errors: array }
  */
  validate: function() {
    var errors = [];

    var mapsValidation = this.validateApiKey(this.googleMapsKey, 'Google Maps API Key');
    if (!mapsValidation.valid) {
      errors.push(mapsValidation.error);
    }

    var directionsValidation = this.validateApiKey(this.googleDirectionsKey, 'Google Directions API Key');
    if (!directionsValidation.valid) {
      errors.push(directionsValidation.error);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  },

  /*
    Reset to original values
  */
  reset: function() {
    this.googleMapsKey = this.originalGoogleMapsKey;
    this.googleDirectionsKey = this.originalGoogleDirectionsKey;
    this.isDirty = false;
  },

  /*
    Mark as saved (update original values)
  */
  markAsSaved: function() {
    this.originalGoogleMapsKey = this.googleMapsKey;
    this.originalGoogleDirectionsKey = this.googleDirectionsKey;
    this.isDirty = false;
  }

});
