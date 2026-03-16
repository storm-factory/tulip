
const Sentry = require('@sentry/electron/main');
const isDev = require('electron-is-dev');
console.log(isDev ? 'Running in development' : 'Running in production');

if (!isDev) {
  Sentry.init({
    dsn: "https://d5e95e1373931cff30184a1e7d504619@o4508879179284480.ingest.de.sentry.io/4508880154918992",
    debug: true
  });
  Sentry.setUser({ip_address: '0.0.0.0'});
}
process.env.APP_IS_DEV = isDev;

const fs = require('fs');
const fsPromises = require('fs').promises; // For promise-based methods
const { Menu, app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
if (require('electron-squirrel-startup')) app.quit();
const path = require('path');
const { saveRecent, getRecents, clearRecents } = require('./src/recentFiles');
require('@electron/remote/main').initialize();
const { createChangelogWindow } = require('./src/changelog');
const { createStreetviewWindow } = require('./src/streetview');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var printWindow = null;
var lexiconWindow = null;
var isSaved = true;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  ipcMain.handle('print-pdf', (event, args) => {
    printPdf(event, args);
  });
  createWindow();
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url); // Open URL in user's browser.
    return { action: "deny" }; // Prevent the app from opening the URL.
  })
  mainWindow.maximize();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {

  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function buildMenu() {
  const recents = getRecents();

  const recentSubmenu = recents.length > 0
    ? [
      ...recents.map(filePath => ({
        label: require('path').basename(filePath),
        sublabel: filePath,
        click: () => sendToWindow('load-roadbook', filePath)
      })),
      { type: 'separator' },
      {
        label: 'Clear Recent',
        click: () => {
          clearRecents();
          buildMenu(); // rebuild menu
        }
      }
    ]
    : [{ label: 'No Recent Files', enabled: false }];
  const template = [
    {
      label: "File",
      submenu: [
        { label: "New", accelerator: "CmdOrCtrl+N", click: () => sendToWindow('new-roadbook') },
        { label: "Open", accelerator: "CmdOrCtrl+O", click: () => sendToWindow('open-roadbook') },
        { label: "Append", click: () => sendToWindow('append-roadbook') },
        { label: 'Open Recent', submenu: recentSubmenu },
        { label: "Save", accelerator: "CmdOrCtrl+S", click: () => sendToWindow('save-roadbook') },
        { label: "Save As", accelerator: "CmdOrCtrl+Shift+S", click: () => sendToWindow('save-roadbook-as') },
        { label: "Import GPX", accelerator: "CmdOrCtrl+I", click: () => sendToWindow('import-gpx') },
        {
          label: "Export",
          submenu: [
            { label: "Export GPX", accelerator: "CmdOrCtrl+E", click: () => sendToWindow('export-gpx') },
            { label: "Export OpenRally GPX", click: () => sendToWindow('export-openrally-gpx') },
            { label: "Export PDF", accelerator: "CmdOrCtrl+P", click: () => sendToWindow('export-pdf') },
          ]
        },
        { label: "Show Lexicon", click: openLexiconWindow },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", click: function () { app.quit(); } },
      ]
    },
    {
      label: "Edit",
      submenu: [
        // { label: "Undo Text", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        // { label: "Redo Text", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        // { type: "separator" },
        // { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        // { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        // { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        // { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
        { label: "Bring to front", click: () => sendToWindow('bring-to-front') },
        { label: "Send to back", click: () => sendToWindow('send-to-back') },
        { type: "separator" },
        {
          label: "Tracks",
          submenu: [
            { label: "Add Track 360", accelerator: "CmdOrCtrl+1", click: () => sendToWindow('add-track-0') },
            { label: "Add Track 45", accelerator: "CmdOrCtrl+2", click: () => sendToWindow('add-track-45') },
            { label: "Add Track 90", accelerator: "CmdOrCtrl+3", click: () => sendToWindow('add-track-90') },
            { label: "Add Track 135", accelerator: "CmdOrCtrl+4", click: () => sendToWindow('add-track-135') },
            { label: "Add Track 180", accelerator: "CmdOrCtrl+5", click: () => sendToWindow('add-track-180') },
            { label: "Add Track 225", accelerator: "CmdOrCtrl+6", click: () => sendToWindow('add-track-225') },
            { label: "Add Track 270", accelerator: "CmdOrCtrl+7", click: () => sendToWindow('add-track-270') },
            { label: "Add Track 315", accelerator: "CmdOrCtrl+8", click: () => sendToWindow('add-track-315') },
            { type: "separator" },
            { label: "Set Track HP", accelerator: "CmdOrCtrl+Option+1", click: () => sendToWindow('set-track-lvt') },
            { label: "Set Track HP", accelerator: "CmdOrCtrl+Option+1", click: () => sendToWindow('set-track-hp') },
            { label: "Set Track P", accelerator: "CmdOrCtrl+Option+2", click: () => sendToWindow('set-track-p') },
            { label: "Set Track PP", accelerator: "CmdOrCtrl+Option+3", click: () => sendToWindow('set-track-pp') },
            { label: "Set Track RO", accelerator: "CmdOrCtrl+Option+4", click: () => sendToWindow('set-track-ro') },
            { label: "Set Track DCW", accelerator: "CmdOrCtrl+Option+5", click: () => sendToWindow('set-track-dcw') },
          ]
        },
        { type: "separator" },
        { label: "Add Glyph", accelerator: "CmdOrCtrl+Option+G", click: () => sendToWindow('add-glyph') },
        { label: "Fill zone speed limit", click: () => sendToWindow('fill-zone-speed-limit') },
        { label: "Roadbook logo", accelerator: "", click: () => sendToWindow('add-roadbook-logo') },
        { label: "Settings", click: () => sendToWindow('open-settings') },
      ]
    },
    {
      label: "View",
      submenu: [
        ...(isDev ?
          [
            { role: 'reload', accelerator: 'CmdOrCtrl+R' },
            { type: "separator" }
          ] : []
        ),
        { label: "Toggle Roadbook", accelerator: "CmdOrCtrl+B", click: () => sendToWindow('toggle-roadbook') },
        { type: "separator" },
        { label: "Zoom in", accelerator: "CmdOrCtrl+Plus", click: () => sendToWindow('zoom-in') },
        { label: "Zoom out", accelerator: "CmdOrCtrl+-", click: () => sendToWindow('zoom-out') },
        { label: "Instruction Street View", click: openStreetviewWindow },
        { type: "separator" },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: function () {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            focusedWindow.webContents.toggleDevTools();
          }
        },
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Changelog", click: () => sendToWindow('open-changelog')
        },
        { label: "User Manual (online)", click: async () => {
          try {
            await shell.openExternal('https://drid.gitlab.io/tulip');
          } catch (err) {
            console.error('Failed to open URL:', err);
          }
        }  },
        { label: "About", click: () => sendToWindow('show-about-info') },
      ]
    }

  ];

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Create the browser window.
  buildMenu();
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    'min-height': 700,
    'title': 'Tulip ' + app.getVersion(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: true,
      nodeIntegration: false
    }
  });

  require('@electron/remote/main').enable(mainWindow.webContents);

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.webContents.load

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    printWindow = null;
  });
  mainWindow.on('close', (event) => {
    if (!isSaved) {
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Save', 'Cancel', 'Don’t Save'],
        defaultId: 1, // Default to 'Cancel'
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Do you want to save them before closing?',
        detail: 'If you don’t save, your changes will be lost.',
      });

      switch (response) {
        case 0: // Save
          mainWindow.webContents.send('save-roadbook');
          event.preventDefault();
          break;
        case 1: // Cancel
          event.preventDefault();
          break;
        case 2: // Don’t Save
          break;
      }
    }
  });
}

function sendToWindow(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  } else if (process.platform === 'darwin') {
    createWindow();
    mainWindow.once('ready-to-show', () => {
      mainWindow.webContents.send(channel, ...args);
    });
  }
}


/*
  IPC LISTENERS
  TODO: the below should go in their own folders and be required
*/
var data;
var settings;

ipcMain.on('ignite-print', (event, arg, appSettings) => {
  printWindow = new BrowserWindow({
    width: 650,
    height: 700,
    'min-height': 700,
    'resizable': true,
    parent: mainWindow, // Set the main window as the parent
    modal: true, // Makes the print window modal
    alwaysOnTop: true, // Ensures the print window stays on top
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
      sandbox: false
    }
  });

  printWindow.setMenu(null);

  require('@electron/remote/main').enable(printWindow.webContents);


  printWindow.loadURL('file://' + __dirname + '/print.html');

  data = arg;
  settings = appSettings;
  printWindow.on('closed', () => {
    printWindow = null
  })

});

//listens for the browser window to say it's ready to print
ipcMain.on('print-launched', (event) => {
  event.sender.send('print-data', data, settings);
});

ipcMain.on('check-file-existence', (event, fileName) => {
  if (fs.existsSync(fileName)) {
    event.reply('file-exists', fileName);
  } else {
    event.reply('file-does-not-exist', fileName);
  }
});

// NOTE this is about as robust as a wet paper bag and fails just as gracefully
function printPdf(event, arg) {
  var size = (arg.opts.pageSize == 'A5' ? 'A5' : 'Roll');
  var filename = arg.filepath.replace('.tlp', '-' + size + '.pdf')

  printWindow.webContents.printToPDF(arg.opts)
    .then(async (data) => {
      try {
        await fsPromises.writeFile(filename, data);
        printWindow.close();
        await dialog.showMessageBox(mainWindow, { title: 'Roadbook PDF Saved', type: 'info', message: "Your PDF has been exported to:\n" + filename, buttons: ['OK'] })
      } catch (error) {
        console.error('Error writing to PDF file:', error.message);
        printWindow.close();
        // Handle specific errors if needed
        if (error.code === 'ENOENT') {
          console.error('The specified directory does not exist.');
          await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'PDF export error',
            message: 'The specified directory does not exist',
            buttons: ['OK']
          });
        } else if (error.code === 'EACCES') {
          console.error('Permission denied when writing to the file.');
          mainWindow.focus();
          await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'PDF export error',
            message: 'Permission denied when writing to the file',
            buttons: ['OK']
          })
        } else {
          console.error('PDF export error.');
          await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'PDF export error',
            message: error.message,
            buttons: ['OK']
          });
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

async function openStreetviewWindow() {
  await createStreetviewWindow(mainWindow);
}

async function openLexiconWindow() {
  await createLexiconWindow(mainWindow);
}

function createLexiconWindow() {
  return new Promise((resolve) => {
    // Prevent multiple instances of the Lexicon window
    if (lexiconWindow) {
      if (lexiconWindow.isMinimized()) {
            lexiconWindow.restore();
        }
        lexiconWindow.show();
        lexiconWindow.focus();
      return;
    }

    lexiconWindow = new BrowserWindow({
      width: 900,
      height: 700,
      title: 'Lexicon',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // Ensure __dirname works correctly in the renderer
        nodeIntegrationInWorker: true
      }
    });
    require('@electron/remote/main').enable(lexiconWindow.webContents);
    lexiconWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url); // Open URL in user's browser.
      return { action: "deny" }; // Prevent the app from opening the URL.
    })
    lexiconWindow.loadURL('file://' + __dirname + '/lexicon.html');
    setLexiconMenu(lexiconWindow);


    // Cleanup when closed
    lexiconWindow.on('closed', () => {
      lexiconWindow = null;
    });
  });
}

function setLexiconMenu(windowInstance) {
    // Safety check: ensure the windowInstance exists before calling setMenu
    if (!windowInstance) return;

    const lexiconTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save as PDF',
                    accelerator: 'CmdOrCtrl+S',
                    click: async () => {
                        // Use windowInstance directly here
                        const { filePath } = await dialog.showSaveDialog(windowInstance, {
                            title: 'Save Lexicon as PDF',
                            defaultPath: 'lexicon.pdf',
                            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
                        });
                        
                        if (filePath) {
                            const data = await windowInstance.webContents.printToPDF({
                                printBackground: true 
                            });
                            require('fs').writeFileSync(filePath, data);
                        }
                    }
                },
                { type: 'separator' },
                { label: 'Close', click: () => windowInstance.close() }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(lexiconTemplate);
    windowInstance.setMenu(menu);
}

//listens for the browser window to ask for the documents folder
ipcMain.on('get-documents-path', (event) => {
  event.sender.send('documents-path', app.getPath('documents'));
});

ipcMain.on("get-app-path", (event) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on("get-app-version", (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('toggle-dev-tools', (event) => {
  mainWindow.toggleDevTools();
})

ipcMain.on('open-dev-tools', (event) => {
  mainWindow.openDevTools();
})

ipcMain.on('open-changelog', async () => {
  const result = await createChangelogWindow(mainWindow);
  mainWindow.webContents.send('changelog-result', result);
});

ipcMain.on('update-saved-state', (event, data) => {
  isSaved = data;
})

ipcMain.handle('get-is-dev', () => isDev);

ipcMain.on('get-user-glyphs', (event, glyphPath) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
      .map(e => e.toLowerCase());

    const results = [];

    function scan(currentPath) {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules') {
            scan(fullPath);
            continue;
          }
        } else {
          const ext = path.extname(file).toLowerCase();
          if (imageExtensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    }

    scan(path.resolve(glyphPath));
    event.sender.send('user-glyphs', results);
})

ipcMain.handle('dialog:showMessageBox', (event, options) => {
  return dialog.showMessageBoxSync(mainWindow, options);
});

ipcMain.on('save-recent-filename', (event, filename) => {
    saveRecent(filename);
    buildMenu();
})