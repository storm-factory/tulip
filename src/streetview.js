const { BrowserWindow, ipcMain } = require('electron');
const { enable } = require('@electron/remote/main');
const path = require('path');
const fs = require('fs');

function createStreetviewWindow(parentWindow) {
    return new Promise((resolve) => {
        // Get parent window dimensions
        const [parentWidth, parentHeight] = parentWindow.getSize();
        const width = Math.round(parentWidth * 0.4); // 40% of parent width
        const height = Math.round(parentHeight * 0.4); // 40% of parent height
        const [parentX, parentY] = parentWindow.getPosition();
        const x = parentX;
        const y = parentY + 25;
        // Create a new BrowserWindow for the streetview
        var streetview = new BrowserWindow({
            x,
            y,
            width: width,
            height: height,
            parent: parentWindow, // Set the parent window
            //   modal: true, // Make it a modal window
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

        enable(streetview.webContents);

        streetview.setMenu(null);

        streetview.loadURL(
            'data:text/html;charset=utf-8,' +
            encodeURIComponent(`
                <!DOCTYPE html>
                <html>
                <head>
                <style>
                    body, html { margin:0; height:100%; font-family: system-ui, sans-serif; }
                    .center {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: #f0f0f0;
                    color: #333;
                    font-size: 1.2em;
                    text-align: center;
                    padding: 20px;
                    }
                </style>
                </head>
                <body>
                <div class="center">
                    Click an instruction in the main window to view Street View.
                </div>
                </body>
                </html>
            `)
        );

        // Show the streetview when it's ready to prevent flickering
        streetview.once('ready-to-show', () => {
            streetview.show();
        });

        // Handle streetview close (if closed without submitting)
        streetview.on('closed', () => {
            streetview = null;
            resolve(null);
        });

        const channel = 'streetview:set-coords';
        const handler = (event, data) => {
            if (!streetview) return;

            const { lat, lng, heading = 0 } = data;
            const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=${heading}`;
            streetview.loadURL(url);
        };

        // Attach the listener **only to this window's webContents**
        streetview.webContents.once('did-finish-load', () => {
            ipcMain.on(channel, handler);
        });

        // Optional: expose a tiny helper so the main process can send directly
        streetview.sendCoords = (coords) => {
            streetview?.webContents.send(channel, coords);
        };

        // ----- 6. Resolve the promise with a helper object -------------
        resolve({
            win: streetview,
            send: (coords) => streetview?.webContents.send(channel, coords),
        });
    });
}

module.exports = { createStreetviewWindow };