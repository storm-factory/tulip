const { BrowserWindow, ipcMain } = require('electron');
const { enable } = require('@electron/remote/main');
const path = require('path');
const fs = require('fs');

function createChangelogWindow(parentWindow) {
  return new Promise((resolve) => {
    // Get parent window dimensions
    const [parentWidth, parentHeight] = parentWindow.getSize();
    const width = Math.round(parentWidth * 0.5); // 50% of parent width
    const height = Math.round(parentHeight * 0.5); // 50% of parent height

    // Create a new BrowserWindow for the changelog
    const changelog = new BrowserWindow({
      width: width,
      height: height,
      parent: parentWindow, // Set the parent window
      modal: true, // Make it a modal window
      show: false, // Don't show until ready
      menuBarVisible: false, // Disable the menu bar
      webPreferences: {
        sandbox: false,
        contextIsolation: true, // Enable context isolation
        enableRemoteModule: true,
        nodeIntegration: false, // Disable Node.js integration
        preload: path.resolve(__dirname, '../preload.js'), // Load preload script
      }
    });
    
    enable(changelog.webContents);

    changelog.setMenu(null);
    
    // Load the changelog's HTML file
    changelog.loadFile(path.join(__dirname, '../changelog.html'));

    // Show the changelog when it's ready to prevent flickering
    changelog.once('ready-to-show', () => {
      changelog.show();
    });

    // Listen for the result from the changelog
    ipcMain.once('changelog-result', (event, result) => {
      resolve(result); // Resolve the promise with the result
    });

    // Handle changelog close (if closed without submitting)
    changelog.on('closed', () => {
      changelog.destroy();
      resolve(null); // Resolve with null if no result is sent
      ipcMain.removeAllListeners('changelog-result'); // Clean up listener
    });
  });
}

module.exports = { createChangelogWindow };