/*
  ---------------------------------------------------------------------------
  DialogService - Handles all user dialogs and messages

  Responsibilities:
  - Show error/success/warning/info messages
  - Show confirmation dialogs
  - Wraps Electron dialog API for consistent messaging

  Following the Service-Oriented Architecture pattern from Phase 2.
  All user-facing dialogs are centralized in this service.
  ---------------------------------------------------------------------------
*/

var DialogService = Class({

  create: function() {
    this.dialog = require('@electron/remote').dialog;
  },

  /*
    Show an error message

    Parameters:
    - message: string - Main error message
    - detail: string (optional) - Additional details

    Returns: Promise<void>
  */
  showError: async function(message, detail) {
    return await this.dialog.showMessageBox({
      type: 'error',
      message: message,
      detail: detail || '',
      buttons: ['OK']
    });
  },

  /*
    Show a success message

    Parameters:
    - message: string - Main success message
    - detail: string (optional) - Additional details

    Returns: Promise<void>
  */
  showSuccess: async function(message, detail) {
    return await this.dialog.showMessageBox({
      type: 'info',
      message: message,
      detail: detail || '',
      buttons: ['OK']
    });
  },

  /*
    Show a warning message

    Parameters:
    - message: string - Main warning message
    - detail: string (optional) - Additional details

    Returns: Promise<void>
  */
  showWarning: async function(message, detail) {
    return await this.dialog.showMessageBox({
      type: 'warning',
      message: message,
      detail: detail || '',
      buttons: ['OK']
    });
  },

  /*
    Show an info message

    Parameters:
    - message: string - Main info message
    - detail: string (optional) - Additional details

    Returns: Promise<void>
  */
  showInfo: async function(message, detail) {
    return await this.dialog.showMessageBox({
      type: 'info',
      message: message,
      detail: detail || '',
      buttons: ['OK']
    });
  },

  /*
    Show a confirmation dialog

    Parameters:
    - message: string - Main question
    - detail: string (optional) - Additional details
    - options: object (optional) - { yesLabel: string, noLabel: string }

    Returns: Promise<boolean> - true if user clicked Yes, false if No
  */
  confirm: async function(message, detail, options) {
    options = options || {};

    var result = await this.dialog.showMessageBox({
      type: 'question',
      message: message,
      detail: detail || '',
      buttons: [options.yesLabel || 'Yes', options.noLabel || 'No'],
      defaultId: 0,
      cancelId: 1
    });

    return result.response === 0;
  },

  /*
    Show a simple alert (using browser alert)
    Note: This is for backward compatibility. Use showInfo/showError instead.

    Parameters:
    - message: string
  */
  alert: function(message) {
    alert(message);
  },

  /*
    Show a custom message box with full options

    Parameters:
    - options: object - Full Electron dialog options

    Returns: Promise<result>
  */
  showMessageBox: async function(options) {
    return await this.dialog.showMessageBox(options);
  }

});
