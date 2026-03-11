/*
  ---------------------------------------------------------------------------
  IPCService - Handles IPC (Inter-Process Communication) with main process

  Responsibilities:
  - Send messages to main process
  - Register listeners for messages from main process
  - Manage IPC event lifecycle
  - Provide clean interface to Electron IPC

  Following the Service-Oriented Architecture pattern from Phase 2.
  All IPC communication is centralized in this service.
  ---------------------------------------------------------------------------
*/

var IPCService = Class({

  create: function() {
    this.ipc = require('electron').ipcRenderer;
    this.listeners = new Map();
  },

  /*
    Register an IPC event listener

    Parameters:
    - channel: string - IPC channel name
    - handler: function(event, arg) - Event handler
  */
  on: function(channel, handler) {
    this.ipc.on(channel, handler);

    // Track listeners for cleanup
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel).push(handler);
  },

  /*
    Send a message to the main process

    Parameters:
    - channel: string - IPC channel name
    - data: any - Data to send
  */
  send: function(channel, data) {
    this.ipc.send(channel, data);
  },

  /*
    Remove a specific listener

    Parameters:
    - channel: string - IPC channel name
    - handler: function - The handler to remove
  */
  removeListener: function(channel, handler) {
    this.ipc.removeListener(channel, handler);

    // Update tracking
    if (this.listeners.has(channel)) {
      var handlers = this.listeners.get(channel);
      var index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  },

  /*
    Remove all listeners for a channel

    Parameters:
    - channel: string - IPC channel name
  */
  removeAllListeners: function(channel) {
    if (channel) {
      this.ipc.removeAllListeners(channel);
      this.listeners.delete(channel);
    } else {
      // Remove all listeners for all channels
      this.listeners.forEach(function(handlers, ch) {
        this.ipc.removeAllListeners(ch);
      }.bind(this));
      this.listeners.clear();
    }
  },

  /*
    Register a one-time listener

    Parameters:
    - channel: string - IPC channel name
    - handler: function(event, arg) - Event handler (called once)
  */
  once: function(channel, handler) {
    this.ipc.once(channel, handler);
  },

  /*
    Send a synchronous message to main process

    Parameters:
    - channel: string - IPC channel name
    - data: any - Data to send

    Returns: any - Response from main process
  */
  sendSync: function(channel, data) {
    return this.ipc.sendSync(channel, data);
  },

  /*
    Invoke a method in main process (Promise-based)

    Parameters:
    - channel: string - IPC channel name
    - args: any - Arguments to pass

    Returns: Promise<any>
  */
  invoke: async function(channel, ...args) {
    return await this.ipc.invoke(channel, ...args);
  }

});
