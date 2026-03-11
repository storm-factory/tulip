/*
  ---------------------------------------------------------------------------
  MapService - Wraps Google Maps API

  Responsibilities:
  - Initialize Google Maps
  - Manage map instance
  - Handle map events
  - Provide clean interface to Google Maps API

  Following the Service-Oriented Architecture pattern from Phase 2.
  Google Maps API interactions are centralized in this service.

  Note: Currently provides basic wrapper functionality.
  In Phase 4, more map operations will be moved here.
  ---------------------------------------------------------------------------
*/

var MapService = Class({

  create: function() {
    this.map = null;
    this.google = window.google;
  },

  /*
    Create and initialize a Google Map

    Parameters:
    - element: DOM element - Container for the map
    - options: object - Google Maps options
      - zoom: number
      - center: { lat: number, lng: number }
      - mapTypeId: string (optional)

    Returns: google.maps.Map instance
  */
  createMap: function(element, options) {
    options = options || {};

    var mapOptions = {
      zoom: options.zoom || 8,
      center: options.center || { lat: 0, lng: 0 },
      mapTypeId: options.mapTypeId || this.google.maps.MapTypeId.HYBRID,
      tilt: 0,
      mapTypeControl: false,
      streetViewControl: false
    };

    this.map = new this.google.maps.Map(element, mapOptions);
    return this.map;
  },

  /*
    Get the current map instance

    Returns: google.maps.Map instance or null
  */
  getMap: function() {
    return this.map;
  },

  /*
    Add event listener to map

    Parameters:
    - event: string - Event name (e.g., 'click', 'idle', 'zoom_changed')
    - handler: function - Event handler
  */
  addListener: function(event, handler) {
    if (this.map) {
      return this.google.maps.event.addListener(this.map, event, handler);
    }
  },

  /*
    Remove event listener from map

    Parameters:
    - listener: google.maps.MapsEventListener
  */
  removeListener: function(listener) {
    if (listener) {
      this.google.maps.event.removeListener(listener);
    }
  },

  /*
    Set map type

    Parameters:
    - mapTypeId: string - 'roadmap', 'satellite', 'hybrid', or 'terrain'
  */
  setMapType: function(mapTypeId) {
    if (this.map) {
      this.map.setMapTypeId(this.google.maps.MapTypeId[mapTypeId.toUpperCase()]);
    }
  },

  /*
    Get current map center

    Returns: google.maps.LatLng
  */
  getCenter: function() {
    if (this.map) {
      return this.map.getCenter();
    }
    return null;
  },

  /*
    Set map center

    Parameters:
    - center: { lat: number, lng: number }
  */
  setCenter: function(center) {
    if (this.map) {
      this.map.setCenter(center);
    }
  },

  /*
    Get current zoom level

    Returns: number
  */
  getZoom: function() {
    if (this.map) {
      return this.map.getZoom();
    }
    return 0;
  },

  /*
    Set zoom level

    Parameters:
    - zoom: number
  */
  setZoom: function(zoom) {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  },

  /*
    Fit map to bounds

    Parameters:
    - bounds: google.maps.LatLngBounds
  */
  fitBounds: function(bounds) {
    if (this.map) {
      this.map.fitBounds(bounds);
    }
  },

  /*
    Pan to location

    Parameters:
    - location: { lat: number, lng: number }
  */
  panTo: function(location) {
    if (this.map) {
      this.map.panTo(location);
    }
  }

});
