/*
  ---------------------------------------------------------------------------
  SettingsService - Handles file I/O for API keys configuration

  Responsibilities:
  - Read api_keys.js file
  - Parse API key values from file
  - Write updated API keys back to file
  - Validate file permissions

  This service isolates all file system operations for settings,
  following the Service-Oriented Architecture pattern.
  ---------------------------------------------------------------------------
*/

var SettingsService = Class({

  create: function() {
    this.fs = require('fs').promises;
    this.path = require('path');
    // Use process.cwd() to get the app root directory
    this.apiKeysPath = this.path.join(process.cwd(), 'api_keys.js');
  },

  /*
    Read the api_keys.js file and extract current key values
    Returns: { googleMapsKey: string, googleDirectionsKey: string }
  */
  readApiKeys: async function() {
    try {
      const fileContent = await this.fs.readFile(this.apiKeysPath, 'utf-8');

      // Extract keys using regex
      const mapsMatch = fileContent.match(/google_maps:\s*['"]([^'"]+)['"]/);
      const directionsMatch = fileContent.match(/google_directions:\s*['"]([^'"]+)['"]/);

      return {
        googleMapsKey: mapsMatch ? mapsMatch[1] : '',
        googleDirectionsKey: directionsMatch ? directionsMatch[1] : ''
      };
    } catch (error) {
      // If file doesn't exist, return empty keys (first-time setup)
      if (error.code === 'ENOENT') {
        return {
          googleMapsKey: '',
          googleDirectionsKey: ''
        };
      }
      throw new Error('Failed to read API keys file: ' + error.message);
    }
  },

  /*
    Write updated API keys back to api_keys.js file
    Preserves the file format and comments

    Parameters:
    - googleMapsKey: string
    - googleDirectionsKey: string
  */
  writeApiKeys: async function(googleMapsKey, googleDirectionsKey) {
    try {
      // Generate file content with proper formatting
      const fileContent = this.generateApiKeysFile(googleMapsKey, googleDirectionsKey);

      // Write to file
      await this.fs.writeFile(this.apiKeysPath, fileContent, 'utf-8');

      return true;
    } catch (error) {
      throw new Error('Failed to write API keys file: ' + error.message);
    }
  },

  /*
    Generate the complete api_keys.js file content
    Preserves comments and format
  */
  generateApiKeysFile: function(googleMapsKey, googleDirectionsKey) {
    return `/*
  Google Maps API Keys

  To get your API keys:
  1. Go to https://console.cloud.google.com/
  2. Create a new project or select existing
  3. Enable these APIs:
     - Maps JavaScript API
     - Directions API (if using route directions)
  4. Go to "Credentials" and create an API key
  5. (Optional) Restrict the key to specific APIs for security
  6. Replace the placeholder values below with your actual keys
*/

const api_keys = Object.freeze({
  google_directions: '${googleDirectionsKey}',
  google_maps: '${googleMapsKey}',
});
`;
  },

  /*
    Check if the api_keys.js file exists
    Returns: boolean
  */
  fileExists: async function() {
    try {
      await this.fs.access(this.apiKeysPath);
      return true;
    } catch (error) {
      return false;
    }
  },

  /*
    Check if the api_keys.js file exists and is writable
    Returns: boolean
  */
  checkFilePermissions: async function() {
    try {
      await this.fs.access(this.apiKeysPath, this.fs.constants.R_OK | this.fs.constants.W_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

});
